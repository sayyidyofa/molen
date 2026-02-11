import { describe, test, expect, beforeEach } from 'bun:test';
import { ExternalClientFactory } from '../src/factories/client.factory';
import { MockElasticClient } from '../src/clients/elastic.mock';
import { MockRedisClient } from '../src/clients/redis.mock';

describe('ExternalClientFactory', () => {
  beforeEach(() => {
    // Set USE_MOCKS for testing
    process.env.USE_MOCKS = 'true';
  });

  test('should create mock Elasticsearch client when USE_MOCKS=true', () => {
    const client = ExternalClientFactory.createElasticClient();
    expect(client).toBeInstanceOf(MockElasticClient);
  });

  test('should create mock Redis client when USE_MOCKS=true', () => {
    const client = ExternalClientFactory.createRedisClient();
    expect(client).toBeInstanceOf(MockRedisClient);
  });

  });
});
