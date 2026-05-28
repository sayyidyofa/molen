import postgres from 'postgres';
import { InputSchema } from '@molen/shared-types';
import { mapSchema } from './mappers';

export class SchemaRepository {
  constructor(private sql: postgres.Sql) {}

  async getSchemas(): Promise<InputSchema[]> {
    return (await this.sql`SELECT * FROM schemas`).map(mapSchema);
  }

  async addSchema(schema: Omit<InputSchema, 'id'>): Promise<InputSchema> {
    const [inserted] = await this.sql`
      INSERT INTO schemas (name, fields, version, status)
      VALUES (${schema.name}, ${this.sql.json(schema.fields as any)}, ${schema.version || null}, ${schema.status || 'active'})
      RETURNING *
    `;
    return mapSchema(inserted);
  }

  async updateSchema(id: string, schema: Partial<InputSchema>): Promise<InputSchema | null> {
    const [updated] = await this.sql`
      UPDATE schemas SET
        name = ${schema.name || this.sql`name`},
        fields = ${schema.fields ? this.sql.json(schema.fields as any) : this.sql`fields`},
        version = ${schema.version || this.sql`version`},
        status = ${schema.status || this.sql`status`}
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? mapSchema(updated) : null;
  }

  async deleteSchema(id: string): Promise<InputSchema | null> {
    const [deleted] = await this.sql`DELETE FROM schemas WHERE id = ${id} RETURNING *`;
    return deleted ? mapSchema(deleted) : null;
  }
}
