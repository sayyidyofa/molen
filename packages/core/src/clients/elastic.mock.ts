import { IElasticClient } from './elastic.interface';

/**
 * Mock Elasticsearch client for testing without external dependencies
 */
export class MockElasticClient implements IElasticClient {
  private mockData: Map<string, any[]> = new Map();

  async search(params: any): Promise<any> {
    const index = params.index || 'default';
    const data = this.mockData.get(index) || [];
    
    return {
      hits: {
        total: { value: data.length },
        hits: data.map((doc, i) => ({
          _index: index,
          _id: `mock-${i}`,
          _source: doc,
        })),
      },
    };
  }

  async index(params: any): Promise<any> {
    const index = params.index || 'default';
    const data = this.mockData.get(index) || [];
    data.push(params.document || params.body);
    this.mockData.set(index, data);

    return {
      _index: index,
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
