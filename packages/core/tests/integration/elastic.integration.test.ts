import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { RealElasticClient } from '../../src/clients/elastic.real';

// Integration tests only run when credentials are provided
const ELASTIC_URL = process.env.ELASTIC_URL;
const ELASTIC_USERNAME = process.env.ELASTIC_USERNAME;
const ELASTIC_PASSWORD = process.env.ELASTIC_PASSWORD;

const shouldRun = ELASTIC_URL && ELASTIC_USERNAME && ELASTIC_PASSWORD;

describe.skipIf(!shouldRun)('RealElasticClient Integration', () => {
  let client: RealElasticClient;

  beforeAll(() => {
    client = new RealElasticClient({
      node: ELASTIC_URL!,
      username: ELASTIC_USERNAME,
      password: ELASTIC_PASSWORD,
    });
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  test('should connect to Elasticsearch and get cluster info', async () => {
    // Use the search method to check connectivity
    const result = await client.search({
      index: '_all',
      size: 0, // Don't return any documents, just metadata
    });

    expect(result).toBeDefined();
    expect(result.hits).toBeDefined();
  });

  test('should create and search for a test document', async () => {
    const testIndex = 'molen-integration-test';
    const testDoc = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Integration test document',
    };

    // Index a test document
    const indexResult = await client.index({
      index: testIndex,
      document: testDoc,
      refresh: 'wait_for', // Wait for the document to be searchable
    });

    expect(indexResult).toBeDefined();
    expect(indexResult._id).toBeDefined();

    // Search for the document
    const searchResult = await client.search({
      index: testIndex,
      query: {
        match: { test: true },
      },
    });

    expect(searchResult.hits.total.value).toBeGreaterThan(0);
    expect(searchResult.hits.hits[0]._source.message).toBe('Integration test document');
  });
});

if (!shouldRun) {
  console.log('⚠️  Elasticsearch integration tests skipped. Set ELASTIC_URL, ELASTIC_USERNAME, and ELASTIC_PASSWORD to run.');
}
