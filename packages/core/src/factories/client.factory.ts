import { IElasticClient } from '../clients/elastic.interface';
import { RealElasticClient } from '../clients/elastic.real';
import { MockElasticClient } from '../clients/elastic.mock';
import { IRedisClient } from '../clients/redis.interface';
import { RealRedisClient } from '../clients/redis.real';
import { MockRedisClient } from '../clients/redis.mock';
import { IS3Client } from '../clients/s3.interface';
import { RealS3Client } from '../clients/s3.real';
import { MockS3Client } from '../clients/s3.mock';
import { IKafkaConnectClient } from '../clients/kafka.interface';
import { MockKafkaConnectClient } from '../clients/kafka.mock';
import { IKafkaBrokerClient } from '../clients/kafka-broker.interface';
import { RealKafkaBrokerClient } from '../clients/kafka-broker.real';
import { MockKafkaBrokerClient } from '../clients/kafka-broker.mock';
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
   * Create a Kafka Connect client for pipeline management
   * Uses mock implementation when USE_MOCKS=true
   * Provides flexible waterfall processing via Kafka Connect
   */
  static createKafkaConnectClient(): IKafkaConnectClient {
    if (process.env.USE_MOCKS === 'true') {
      return new MockKafkaConnectClient({ apiUrl: 'http://localhost:4195' });
    }

    const apiUrl = process.env.KAFKA_CONNECT_URL || 'http://localhost:4195';
    const apiKey = process.env.KAFKA_CONNECT_API_KEY;

    // Real implementation will be added later
    // For now, return mock even in production until real client is implemented
    return new MockKafkaConnectClient({ apiUrl, apiKey });
  }

  /**
   * Create a Kafka broker client for Kafka API access
   * Uses mock implementation when USE_MOCKS=true
   * Provides direct access to Kafka message streaming (compatible with Kafka, Kafka, etc.)
   */
  static createKafkaBrokerClient(): IKafkaBrokerClient {
    if (process.env.USE_MOCKS === 'true') {
      return new MockKafkaBrokerClient({
        brokers: ['localhost:9092'],
      });
    }

    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    const username = process.env.KAFKA_USERNAME;
    const password = process.env.KAFKA_PASSWORD;
    const saslMechanism = process.env.KAFKA_SASL_MECHANISM as 'plain' | 'scram-sha-256' | 'scram-sha-512' | undefined;

    if (!username || !password) {
      throw new Error('Kafka credentials not provided. Set KAFKA_USERNAME and KAFKA_PASSWORD environment variables.');
    }

    return new RealKafkaBrokerClient({
      brokers,
      ssl: true,
      sasl: {
        mechanism: saslMechanism || 'scram-sha-256',
        username,
        password,
      },
    });
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
