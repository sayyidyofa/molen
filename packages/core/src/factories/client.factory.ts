import { IElasticClient } from '../clients/elastic.interface';
import { RealElasticClient } from '../clients/elastic.real';
import { MockElasticClient } from '../clients/elastic.mock';
import { IRedisClient } from '../clients/redis.interface';
import { RealRedisClient } from '../clients/redis.real';
import { MockRedisClient } from '../clients/redis.mock';
import { IFlinkClient } from '../clients/flink.interface';
import { RealFlinkClient } from '../clients/flink.real';
import { MockFlinkClient } from '../clients/flink.mock';
import { IS3Client } from '../clients/s3.interface';
import { RealS3Client } from '../clients/s3.real';
import { MockS3Client } from '../clients/s3.mock';
import { IRedpandaConnectClient } from '../clients/redpanda.interface';
import { MockRedpandaConnectClient } from '../clients/redpanda.mock';
import { IMLTrainer } from '../clients/mltrainer.interface';
import { MockMLTrainer } from '../clients/mltrainer.mock';

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

  /**
   * Create an S3 client for ML model storage
   * Uses mock implementation when USE_MOCKS=true
   * Supports Cloudflare R2 and other S3-compatible endpoints
   */
  static createS3Client(): IS3Client {
    if (process.env.USE_MOCKS === 'true') {
      return new MockS3Client();
    }

    const endpoint = process.env.S3_ENDPOINT || 'https://s3.amazonaws.com';
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';
    const bucket = process.env.S3_BUCKET || 'ml-models';
    const region = process.env.S3_REGION;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('S3 credentials not provided. Set S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY environment variables.');
    }

    return new RealS3Client({
      endpoint,
      accessKeyId,
      secretAccessKey,
      bucket,
      region,
    });
  }

  /**
   * Create a Redpanda Connect client for pipeline management
   * Uses mock implementation when USE_MOCKS=true
   * Replaces direct Flink integration for flexible waterfall processing
   */
  static createRedpandaConnectClient(): IRedpandaConnectClient {
    if (process.env.USE_MOCKS === 'true') {
      return new MockRedpandaConnectClient({ apiUrl: 'http://localhost:4195' });
    }

    const apiUrl = process.env.REDPANDA_CONNECT_URL || 'http://localhost:4195';
    const apiKey = process.env.REDPANDA_CONNECT_API_KEY;

    // Real implementation will be added later
    // For now, return mock even in production until real client is implemented
    return new MockRedpandaConnectClient({ apiUrl, apiKey });
  }

  /**
   * Create an ML Trainer client for self-service model training
   * Uses mock implementation when USE_MOCKS=true
   */
  static createMLTrainer(): IMLTrainer {
    if (process.env.USE_MOCKS === 'true') {
      return new MockMLTrainer();
    }

    // Real implementation will be added later
    // For now, return mock even in production until real client is implemented
    return new MockMLTrainer();
  }
}
