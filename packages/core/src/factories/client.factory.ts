import { IElasticClient } from '../clients/elastic.interface';
import { RealElasticClient } from '../clients/elastic.real';
import { MockElasticClient } from '../clients/elastic.mock';
import { IRedisClient } from '../clients/redis.interface';
import { RealRedisClient } from '../clients/redis.real';
import { MockRedisClient } from '../clients/redis.mock';
import { IFlinkClient } from '../clients/flink.interface';
import { RealFlinkClient } from '../clients/flink.real';
import { MockFlinkClient } from '../clients/flink.mock';

/**
 * Factory for creating external service clients with environment-based switching
 * Implements REQ-2.1 and REQ-2.2 from the SRS
 */
export class ExternalClientFactory {
  /**
   * Create an Elasticsearch client
   * Uses mock implementation when USE_MOCKS=true, otherwise creates real client
   * Supports SSL/TLS via CA_CERT_PATH (REQ-2.3)
   */
  static createElasticClient(): IElasticClient {
    if (process.env.USE_MOCKS === 'true') {
      return new MockElasticClient();
    }
    
    const node = process.env.ELASTIC_URL || process.env.INDEX_URL || 'http://localhost:9200';
    const caPath = process.env.CA_CERT_PATH;
    
    return new RealElasticClient({ node, caPath });
  }

  /**
   * Create a Redis client
   * Uses mock implementation when USE_MOCKS=true
   */
  static createRedisClient(): IRedisClient {
    if (process.env.USE_MOCKS === 'true') {
      return new MockRedisClient();
    }

    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    
    return new RealRedisClient({ host, port });
  }

  /**
   * Create a Flink client
   * Uses mock implementation when USE_MOCKS=true
   */
  static createFlinkClient(): IFlinkClient {
    if (process.env.USE_MOCKS === 'true') {
      return new MockFlinkClient();
    }

    const apiUrl = process.env.FLINK_API_URL || 'http://localhost:8081';
    
    return new RealFlinkClient({ apiUrl });
  }
}
