import { describe, test, expect, beforeEach } from 'bun:test';
import { MockElasticClient } from '../src/clients/elastic.mock';

describe('MockElasticClient', () => {
  let client: MockElasticClient;

  beforeEach(() => {
    client = new MockElasticClient();
  });

  test('should index and search documents', async () => {
    // Index a document
    await client.index({
      index: 'test-index',
      document: { name: 'Test Document', value: 123 },
    });

    // Search for documents
    const result = await client.search({ index: 'test-index' });

    expect(result.hits.total.value).toBe(1);
    expect(result.hits.hits[0]._source.name).toBe('Test Document');
  });

  test('should clear mock data', async () => {
    await client.index({
      index: 'test-index',
      document: { name: 'Test' },
    });

    client.clearMockData();

    const result = await client.search({ index: 'test-index' });
    expect(result.hits.total.value).toBe(0);
  });
});
