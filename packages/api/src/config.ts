/**
 * Configuration for the Fraud-Ops Control Plane API
 */
export interface ApiConfig {
  port: number;
  shadowMode: boolean;
  elasticUrl: string;
  redisHost: string;
  redisPort: number;
  flinkApiUrl: string;
  caCertPath?: string;
  useMocks: boolean;
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): ApiConfig {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    shadowMode: process.env.SHADOW_MODE === 'true',
    elasticUrl: process.env.ELASTIC_URL || process.env.INDEX_URL || 'http://localhost:9200',
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    flinkApiUrl: process.env.FLINK_API_URL || 'http://localhost:8081',
    caCertPath: process.env.CA_CERT_PATH,
    useMocks: process.env.USE_MOCKS === 'true',
  };
}
