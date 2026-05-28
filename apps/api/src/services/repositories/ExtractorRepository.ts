import postgres from 'postgres';
import { FeatureExtractor } from '@molen/shared-types';
import { mapExtractor } from './mappers';

export class ExtractorRepository {
  constructor(private sql: postgres.Sql) {}

  async getExtractors(): Promise<FeatureExtractor[]> {
    return (await this.sql`SELECT * FROM feature_extractors`).map(mapExtractor);
  }

  async addExtractor(extractor: Omit<FeatureExtractor, 'id'>): Promise<FeatureExtractor> {
    const [inserted] = await this.sql`
      INSERT INTO feature_extractors (name, source_field, transformation, output_type)
      VALUES (${extractor.name}, ${extractor.sourceField}, ${extractor.transformation}, ${extractor.outputType})
      RETURNING *
    `;
    return mapExtractor(inserted);
  }

  async deleteExtractor(id: string): Promise<FeatureExtractor | null> {
    const [deleted] = await this.sql`DELETE FROM feature_extractors WHERE id = ${id} RETURNING *`;
    return deleted ? mapExtractor(deleted) : null;
  }

  async updateExtractor(id: string, extractor: Partial<FeatureExtractor>): Promise<FeatureExtractor | null> {
    const [updated] = await this.sql`
      UPDATE feature_extractors SET
        name = ${extractor.name || this.sql`name`},
        source_field = ${extractor.sourceField || this.sql`source_field`},
        transformation = ${extractor.transformation || this.sql`transformation`},
        output_type = ${extractor.outputType || this.sql`output_type`}
      WHERE id = ${id}
      RETURNING *
    `;
    return updated ? mapExtractor(updated) : null;
  }
}
