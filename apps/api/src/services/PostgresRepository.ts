import { 
  InputSchema, 
  SchemaField,
  FeatureExtractor, 
  Rule, 
  MLModel, 
  RuleType, 
  TypedRule, 
  Draft, 
  CommittedVersion, 
  DeploymentEnvironment,
  DataType,
  RuleAction
} from '@molen/shared-types';
import { IMolenRepository } from './interfaces';
import postgres from 'postgres';

export class PostgresRepository implements IMolenRepository {
  private sql: postgres.Sql;

  constructor(url: string) {
    this.sql = postgres(url);
  }

  // Mapping helpers
  private mapSchema = (s: Record<string, any>): InputSchema => ({
    id: String(s.id),
    name: String(s.name),
    fields: s.fields as SchemaField[],
    version: s.version ? String(s.version) : undefined,
    status: s.status ? String(s.status) : undefined,
  });

  private mapExtractor = (e: Record<string, any>): FeatureExtractor => ({
    id: String(e.id),
    name: String(e.name),
    sourceField: String(e.source_field),
    transformation: String(e.transformation),
    outputType: e.output_type as DataType,
  });

  private mapRule = (r: Record<string, any>): Rule => ({
    id: String(r.id),
    name: String(r.name),
    condition: String(r.condition),
    anomalyScore: Number(r.anomaly_score),
    action: r.action as RuleAction,
  });

  private mapModel = (m: Record<string, any>): MLModel => ({
    id: String(m.id),
    name: String(m.name),
    modelUrl: String(m.model_url),
    outputType: DataType.ANOMALY_SCORE,
    version: m.version ? String(m.version) : undefined,
    accuracy: m.accuracy ? Number(m.accuracy) : undefined,
    fpr: m.fpr ? Number(m.fpr) : undefined,
    status: m.status ? String(m.status) : undefined,
  });

  private mapRuleType = (rt: Record<string, any>): RuleType => ({
    id: String(rt.id),
    name: String(rt.name),
    baseType: String(rt.base_type),
    schema: rt.schema as Record<string, unknown>,
    description: rt.description ? String(rt.description) : undefined,
  });

  private mapTypedRule = (tr: Record<string, any>): TypedRule => ({
    id: String(tr.id),
    name: String(tr.name),
    ruleTypeId: String(tr.rule_type_id),
    description: tr.description ? String(tr.description) : undefined,
    mode: String(tr.mode),
    visualBlocks: tr.visual_blocks as Record<string, unknown>,
    codeExpression: tr.code_expression ? String(tr.code_expression) : undefined,
    action: tr.action as RuleAction,
    priority: Number(tr.priority),
    status: String(tr.status),
  });

  private mapDraft = (d: Record<string, any>): Draft => ({
    id: String(d.id),
    name: String(d.name),
    description: d.description ? String(d.description) : undefined,
    graph: d.graph as any,
    updatedAt: new Date(String(d.updated_at)),
    status: d.status ? String(d.status) : undefined,
  });

  private mapVersion = (v: Record<string, any>): CommittedVersion => ({
    id: String(v.id),
    draftId: String(v.draft_id),
    version: Number(v.version),
    graph: v.graph as any,
    committedAt: new Date(String(v.committed_at)),
  });

  private mapDeployment = (d: Record<string, any>): DeploymentEnvironment => ({
    id: String(d.id),
    name: String(d.name),
    activeVersionId: String(d.active_version_id),
    deployedAt: new Date(String(d.deployed_at)),
  });

  async getSchemas(): Promise<InputSchema[]> {
    return (await this.sql`SELECT * FROM schemas`).map(this.mapSchema);
  }
  async addSchema(schema: Omit<InputSchema, 'id'>): Promise<InputSchema> {
    const [inserted] = await this.sql`
      INSERT INTO schemas (name, fields, version, status)
      VALUES (${schema.name}, ${this.sql.json(schema.fields as any)}, ${schema.version || 'v1.0'}, ${schema.status || 'active'})
      RETURNING *
    `;
    return this.mapSchema(inserted);
  }
  async updateSchema(id: string, schema: Partial<InputSchema>): Promise<InputSchema | null> {
    const [updated] = await this.sql`
      UPDATE schemas
      SET 
        name = ${schema.name !== undefined ? schema.name : this.sql`name`},
        fields = ${schema.fields !== undefined ? this.sql.json(schema.fields as any) : this.sql`fields`},
        version = ${schema.version !== undefined ? schema.version : this.sql`version`},
        status = ${schema.status !== undefined ? schema.status : this.sql`status`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? this.mapSchema(updated) : null;
  }
  async deleteSchema(id: string): Promise<InputSchema | null> {
    const [deleted] = await this.sql`DELETE FROM schemas WHERE id = ${id} RETURNING *`;
    return deleted ? this.mapSchema(deleted) : null;
  }

  async getExtractors(): Promise<FeatureExtractor[]> {
    return (await this.sql`SELECT * FROM extractors`).map(this.mapExtractor);
  }
  async addExtractor(extractor: Omit<FeatureExtractor, 'id'>): Promise<FeatureExtractor> {
    const [inserted] = await this.sql`
      INSERT INTO extractors (name, source_field, transformation, output_type)
      VALUES (${extractor.name}, ${extractor.sourceField}, ${extractor.transformation}, ${extractor.outputType})
      RETURNING *
    `;
    return this.mapExtractor(inserted);
  }
  async deleteExtractor(id: string): Promise<FeatureExtractor | null> {
    const [deleted] = await this.sql`DELETE FROM extractors WHERE id = ${id} RETURNING *`;
    return deleted ? this.mapExtractor(deleted) : null;
  }

  async updateExtractor(id: string, extractor: Partial<FeatureExtractor>): Promise<FeatureExtractor | null> {
    const [updated] = await this.sql`
      UPDATE extractors
      SET 
        name = ${extractor.name !== undefined ? extractor.name : this.sql`name`},
        source_field = ${extractor.sourceField !== undefined ? extractor.sourceField : this.sql`source_field`},
        transformation = ${extractor.transformation !== undefined ? extractor.transformation : this.sql`transformation`},
        output_type = ${extractor.outputType !== undefined ? extractor.outputType : this.sql`output_type`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? this.mapExtractor(updated) : null;
  }

  async getRules(): Promise<Rule[]> {
    return (await this.sql`SELECT * FROM rules`).map(this.mapRule);
  }
  async addRule(rule: Omit<Rule, 'id'>): Promise<Rule> {
    const [inserted] = await this.sql`
      INSERT INTO rules (name, condition, anomaly_score, action)
      VALUES (${rule.name}, ${rule.condition}, ${rule.anomalyScore}, ${rule.action})
      RETURNING *
    `;
    return this.mapRule(inserted);
  }
  async deleteRule(id: string): Promise<Rule | null> {
    const [deleted] = await this.sql`DELETE FROM rules WHERE id = ${id} RETURNING *`;
    return deleted ? this.mapRule(deleted) : null;
  }

  async updateRule(id: string, rule: Partial<Rule>): Promise<Rule | null> {
    const [updated] = await this.sql`
      UPDATE rules
      SET 
        name = ${rule.name !== undefined ? rule.name : this.sql`name`},
        condition = ${rule.condition !== undefined ? rule.condition : this.sql`condition`},
        anomaly_score = ${rule.anomalyScore !== undefined ? rule.anomalyScore : this.sql`anomaly_score`},
        action = ${rule.action !== undefined ? rule.action : this.sql`action`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? this.mapRule(updated) : null;
  }

  async getModels(): Promise<MLModel[]> {
    return (await this.sql`SELECT * FROM models`).map(this.mapModel);
  }
  async addModel(model: Omit<MLModel, 'id'>): Promise<MLModel> {
    const [inserted] = await this.sql`
      INSERT INTO models (name, model_url, output_type, version, accuracy, fpr, status)
      VALUES (${model.name}, ${model.modelUrl}, ${model.outputType}, ${model.version || 'v1.0'}, ${model.accuracy || 95.0}, ${model.fpr || 1.0}, ${model.status || 'training'})
      RETURNING *
    `;
    return this.mapModel(inserted);
  }
  async deleteModel(id: string): Promise<MLModel | null> {
    const [deleted] = await this.sql`DELETE FROM models WHERE id = ${id} RETURNING *`;
    return deleted ? this.mapModel(deleted) : null;
  }

  async updateModel(id: string, model: Partial<MLModel>): Promise<MLModel | null> {
    const [updated] = await this.sql`
      UPDATE models
      SET 
        name = ${model.name !== undefined ? model.name : this.sql`name`},
        model_url = ${model.modelUrl !== undefined ? model.modelUrl : this.sql`model_url`},
        output_type = ${model.outputType !== undefined ? model.outputType : this.sql`output_type`},
        version = ${model.version !== undefined ? model.version : this.sql`version`},
        accuracy = ${model.accuracy !== undefined ? model.accuracy : this.sql`accuracy`},
        fpr = ${model.fpr !== undefined ? model.fpr : this.sql`fpr`},
        status = ${model.status !== undefined ? model.status : this.sql`status`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? this.mapModel(updated) : null;
  }

  async getRuleTypes(): Promise<RuleType[]> {
    return (await this.sql`SELECT * FROM rule_types`).map(this.mapRuleType);
  }
  async addRuleType(ruleType: Omit<RuleType, 'id'>): Promise<RuleType> {
    const [inserted] = await this.sql`
      INSERT INTO rule_types (name, base_type, schema, description)
      VALUES (${ruleType.name}, ${ruleType.baseType}, ${this.sql.json((ruleType.schema || {}) as any)}, ${ruleType.description || null})
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, base_type = EXCLUDED.base_type, schema = EXCLUDED.schema, description = EXCLUDED.description
      RETURNING *
    `;
    return this.mapRuleType(inserted);
  }
  async deleteRuleType(id: string): Promise<RuleType | null> {
    const [deleted] = await this.sql`DELETE FROM rule_types WHERE id = ${id} RETURNING *`;
    return deleted ? this.mapRuleType(deleted) : null;
  }

  async updateRuleType(id: string, ruleType: Partial<RuleType>): Promise<RuleType | null> {
    const [updated] = await this.sql`
      UPDATE rule_types
      SET 
        name = ${ruleType.name !== undefined ? ruleType.name : this.sql`name`},
        base_type = ${ruleType.baseType !== undefined ? ruleType.baseType : this.sql`base_type`},
        schema = ${ruleType.schema !== undefined ? this.sql.json(ruleType.schema as any) : this.sql`schema`},
        description = ${ruleType.description !== undefined ? ruleType.description : this.sql`description`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? this.mapRuleType(updated) : null;
  }

  async getTypedRules(): Promise<TypedRule[]> {
    return (await this.sql`SELECT * FROM typed_rules`).map(this.mapTypedRule);
  }
  async addTypedRule(typedRule: Omit<TypedRule, 'id'>): Promise<TypedRule> {
    const [inserted] = await this.sql`
      INSERT INTO typed_rules (name, rule_type_id, description, mode, visual_blocks, code_expression, action, priority, status)
      VALUES (${typedRule.name}, ${typedRule.ruleTypeId}, ${typedRule.description || null}, ${typedRule.mode}, ${this.sql.json((typedRule.visualBlocks || {}) as any)}, ${typedRule.codeExpression || null}, ${typedRule.action}, ${typedRule.priority}, ${typedRule.status})
      RETURNING *
    `;
    return this.mapTypedRule(inserted);
  }
  async deleteTypedRule(id: string): Promise<TypedRule | null> {
    const [deleted] = await this.sql`DELETE FROM typed_rules WHERE id = ${id} RETURNING *`;
    return deleted ? this.mapTypedRule(deleted) : null;
  }

  async updateTypedRule(id: string, typedRule: Partial<TypedRule>): Promise<TypedRule | null> {
    const [updated] = await this.sql`
      UPDATE typed_rules
      SET 
        name = ${typedRule.name !== undefined ? typedRule.name : this.sql`name`},
        rule_type_id = ${typedRule.ruleTypeId !== undefined ? typedRule.ruleTypeId : this.sql`rule_type_id`},
        description = ${typedRule.description !== undefined ? typedRule.description : this.sql`description`},
        mode = ${typedRule.mode !== undefined ? typedRule.mode : this.sql`mode`},
        visual_blocks = ${typedRule.visualBlocks !== undefined ? this.sql.json(typedRule.visualBlocks as any) : this.sql`visual_blocks`},
        code_expression = ${typedRule.codeExpression !== undefined ? typedRule.codeExpression : this.sql`code_expression`},
        action = ${typedRule.action !== undefined ? typedRule.action : this.sql`action`},
        priority = ${typedRule.priority !== undefined ? typedRule.priority : this.sql`priority`},
        status = ${typedRule.status !== undefined ? typedRule.status : this.sql`status`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? this.mapTypedRule(updated) : null;
  }

  async getDrafts(): Promise<Draft[]> {
    return (await this.sql`SELECT * FROM drafts`).map(this.mapDraft);
  }
  async getDraft(id: string): Promise<Draft | null> {
    const [draft] = await this.sql`SELECT * FROM drafts WHERE id = ${id}`;
    return draft ? this.mapDraft(draft) : null;
  }
  async saveDraft(draft: Draft | Omit<Draft, 'id'>): Promise<Draft> {
    if ('id' in draft && draft.id) {
      const [updated] = await this.sql`
        INSERT INTO drafts (id, name, graph)
        VALUES (${draft.id}, ${draft.name}, ${this.sql.json(draft.graph as any)})
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, graph = EXCLUDED.graph, updated_at = NOW()
        RETURNING *
      `;
      return this.mapDraft(updated);
    }
    const [inserted] = await this.sql`INSERT INTO drafts (name, graph) VALUES (${draft.name}, ${this.sql.json(draft.graph as any)}) RETURNING *`;
    return this.mapDraft(inserted);
  }
  async deleteDraft(id: string): Promise<Draft | null> {
    const [deleted] = await this.sql`DELETE FROM drafts WHERE id = ${id} RETURNING *`;
    return deleted ? this.mapDraft(deleted) : null;
  }

  async getVersions(draftId: string): Promise<CommittedVersion[]> {
    return (await this.sql`SELECT * FROM committed_versions WHERE draft_id = ${draftId} ORDER BY version DESC`).map(this.mapVersion);
  }
  async getVersion(versionId: string): Promise<CommittedVersion | null> {
    const [version] = await this.sql`SELECT * FROM committed_versions WHERE id = ${versionId}`;
    return version ? this.mapVersion(version) : null;
  }
  async commitVersion(draftId: string): Promise<CommittedVersion> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');
    const [lastVersion] = await this.sql`SELECT version FROM committed_versions WHERE draft_id = ${draftId} ORDER BY version DESC LIMIT 1`;
    const nextVersion = (lastVersion?.version ?? 0) + 1;
    const [committed] = await this.sql`
      INSERT INTO committed_versions (draft_id, version, graph)
      VALUES (${draftId}, ${nextVersion}, ${this.sql.json(draft.graph as any)})
      RETURNING *
    `;
    return this.mapVersion(committed);
  }
  async getDeployments(): Promise<DeploymentEnvironment[]> {
    return (await this.sql`SELECT * FROM deployments`).map(this.mapDeployment);
  }
  async promoteDeployment(name: string, versionId: string): Promise<DeploymentEnvironment> {
    const [deployment] = await this.sql`
      INSERT INTO deployments (name, active_version_id)
      VALUES (${name}, ${versionId})
      ON CONFLICT (name) DO UPDATE SET active_version_id = EXCLUDED.active_version_id, deployed_at = NOW()
      RETURNING *
    `;
    return this.mapDeployment(deployment);
  }
}
