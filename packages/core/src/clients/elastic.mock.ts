import { IElasticClient, ElasticsearchResponse, SearchParams, IndexParams } from './elastic.interface';

/**
 * Mock Elasticsearch client for testing without external dependencies
 */
export class MockElasticClient implements IElasticClient {
  private mockData: Map<string, unknown[]> = new Map();

  async search<T = unknown>(params: SearchParams): Promise<ElasticsearchResponse<T>> {
    const index = params.index || 'default';
    const data = this.mockData.get(index) || [];
    
    return {
      hits: {
        total: { value: data.length },
        hits: data.map((doc, i) => ({
          _id: `mock-${i}`,
          _source: doc as T,
        })),
      },
    };
  }

  async index(params: IndexParams): Promise<{ result: string; _id: string }> {
    const index = params.index || 'default';
    const data = this.mockData.get(index) || [];
    data.push(params.document);
    this.mockData.set(index, data);

    return {
      _id: `mock-${data.length}`,
      result: 'created',
    };
  }

  async close(): Promise<void> {
    // No-op for mock
  }

  // Helper method for testing
  clearMockData(): void {
    this.mockData.clear();
  }
}
