import postgres from 'postgres';
import { MLModel, DataType } from '@molen/shared-types';
import { mapModel } from './mappers';

export class ModelRepository {
  constructor(private sql: postgres.Sql) {}

  async getModels(): Promise<MLModel[]> {
    return (await this.sql`SELECT * FROM ml_models`).map(mapModel);
  }

  async addModel(model: Omit<MLModel, 'id'>): Promise<MLModel> {
    const [inserted] = await this.sql`
      INSERT INTO ml_models (name, model_url, version, accuracy, fpr, status)
      VALUES (${model.name}, ${model.modelUrl}, ${model.version || null}, ${model.accuracy || null}, ${model.fpr || null}, ${model.status || 'active'})
      RETURNING *
    `;
    return mapModel(inserted);
  }

  async deleteModel(id: string): Promise<MLModel | null> {
    const [deleted] = await this.sql`DELETE FROM ml_models WHERE id = ${id} RETURNING *`;
    return deleted ? mapModel(deleted) : null;
  }

  async updateModel(id: string, model: Partial<MLModel>): Promise<MLModel | null> {
    const [updated] = await this.sql`
      UPDATE ml_models SET
        name = ${model.name || this.sql`name`},
        model_url = ${model.modelUrl || this.sql`model_url`},
        version = ${model.version || this.sql`version`},
        accuracy = ${model.accuracy !== undefined ? model.accuracy : this.sql`accuracy`},
        fpr = ${model.fpr !== undefined ? model.fpr : this.sql`fpr`},
        status = ${model.status || this.sql`status`}
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? mapModel(updated) : null;
  }
}
