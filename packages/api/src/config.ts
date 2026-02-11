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
  databaseUrl: string;
  redisUrl: string;
  sessionTTL: number;
  oauth2: {
    enabled: boolean;
    provider: string;
    clientId: string;
    clientSecret: string;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    redirectUri: string;
    scopes: string[];
  };
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
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/molen',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    sessionTTL: parseInt(process.env.SESSION_TTL || '86400', 10),
    oauth2: {
      enabled: process.env.OAUTH2_ENABLED === 'true',
      provider: process.env.OAUTH2_PROVIDER || 'keycloak',
      clientId: process.env.OAUTH2_CLIENT_ID || '',
      clientSecret: process.env.OAUTH2_CLIENT_SECRET || '',
      authorizationUrl: process.env.OAUTH2_AUTHORIZATION_URL || '',
      tokenUrl: process.env.OAUTH2_TOKEN_URL || '',
      userInfoUrl: process.env.OAUTH2_USERINFO_URL || '',
      redirectUri: process.env.OAUTH2_REDIRECT_URI || 'http://localhost:3000/auth/oauth2/callback',
      scopes: (process.env.OAUTH2_SCOPES || 'openid,profile,email').split(','),
    },
  };
}
