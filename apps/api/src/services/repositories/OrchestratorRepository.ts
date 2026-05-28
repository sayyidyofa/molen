import postgres from 'postgres';
import { Draft, CommittedVersion, DeploymentEnvironment } from '@molen/shared-types';
import { mapDraft, mapVersion, mapDeployment } from './mappers';

export class OrchestratorRepository {
  constructor(private sql: postgres.Sql) {}

  async getDrafts(): Promise<Draft[]> {
    return (await this.sql`SELECT * FROM orchestrator_drafts ORDER BY updated_at DESC`).map(mapDraft);
  }

  async getDraft(id: string): Promise<Draft | null> {
    const [d] = await this.sql`SELECT * FROM orchestrator_drafts WHERE id = ${id}`;
    return d ? mapDraft(d) : null;
  }

  async saveDraft(draft: Partial<Draft>): Promise<Draft> {
    if (draft.id) {
      const [updated] = await this.sql`
        UPDATE orchestrator_drafts SET
          name = ${draft.name || this.sql`name`},
          description = ${draft.description || this.sql`description`},
          graph = ${draft.graph ? this.sql.json(draft.graph as any) : this.sql`graph`},
          updated_at = NOW(),
          status = ${draft.status || this.sql`status`}
        WHERE id = ${draft.id}
        RETURNING *
      `;
      return mapDraft(updated);
    } else {
      const [inserted] = await this.sql`
        INSERT INTO orchestrator_drafts (name, description, graph, status)
        VALUES (${draft.name || 'New Orchestrator'}, ${draft.description || null}, ${this.sql.json((draft.graph || { nodes: [], edges: [] }) as any)}, 'draft')
        RETURNING *
      `;
      return mapDraft(inserted);
    }
  }

  async deleteDraft(id: string): Promise<Draft | null> {
    const [deleted] = await this.sql`DELETE FROM orchestrator_drafts WHERE id = ${id} RETURNING *`;
    return deleted ? mapDraft(deleted) : null;
  }

  async getVersions(draftId: string): Promise<CommittedVersion[]> {
    return (await this.sql`SELECT * FROM orchestrator_versions WHERE draft_id = ${draftId} ORDER BY version DESC`).map(mapVersion);
  }

  async getVersion(versionId: string): Promise<CommittedVersion | null> {
    const [v] = await this.sql`SELECT * FROM orchestrator_versions WHERE id = ${versionId}`;
    return v ? mapVersion(v) : null;
  }

  async commitVersion(draftId: string): Promise<CommittedVersion> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error("Draft not found");

    const [v] = await this.sql`
      INSERT INTO orchestrator_versions (draft_id, version, graph)
      SELECT id, (SELECT COALESCE(MAX(version), 0) + 1 FROM orchestrator_versions WHERE draft_id = ${draftId}), graph
      FROM orchestrator_drafts WHERE id = ${draftId}
      RETURNING *
    `;
    return mapVersion(v);
  }

  async getDeployments(): Promise<DeploymentEnvironment[]> {
    return (await this.sql`SELECT * FROM deployments`).map(mapDeployment);
  }

  async promoteDeployment(name: string, versionId: string): Promise<DeploymentEnvironment> {
    const [d] = await this.sql`
      INSERT INTO deployments (name, active_version_id, deployed_at)
      VALUES (${name}, ${versionId}, NOW())
      ON CONFLICT (name) DO UPDATE SET active_version_id = EXCLUDED.active_version_id, deployed_at = NOW()
      RETURNING *
    `;
    return mapDeployment(d);
  }
}
