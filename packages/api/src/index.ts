import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { loadConfig } from './config';
import {
  PostgresUserRepository,
  RedisSessionStore,
  OAuth2Client,
  initializeAuthSchema,
} from '@molen/core';
import postgres from 'postgres';
import { WaterfallService } from './services/waterfall.service';
import { RuleService } from './services/rule.service';
import { TriageService } from './services/triage.service';
import { AuthService } from './services/auth.service';
import { waterfallRoutes } from './routes/waterfall.routes';
import { ruleRoutes } from './routes/rule.routes';
import { triageRoutes } from './routes/triage.routes';
import { mlRoutes } from './routes/ml.routes';
import { authRoutes } from './routes/auth.routes';
import { createAuthMiddleware } from './middleware/auth.middleware';

/**
 * Molen Fraud-Ops Control Plane API Server
 * Self-Service Internal Developer Platform for Fraud Analysts
 * Built with Bun and ElysiaJS for maximum performance (NFR-1.1)
 */

// Load configuration
const config = loadConfig();

// Initialize database connection
const sql = postgres(config.databaseUrl);

// Initialize authentication infrastructure
const userRepository = new PostgresUserRepository(config.databaseUrl);
const sessionStore = new RedisSessionStore({
  redisUrl: config.redisUrl,
  ttl: config.sessionTTL,
});

// Initialize OAuth2 client (if enabled)
let oauth2Client;
if (config.oauth2.enabled) {
  oauth2Client = new OAuth2Client({
    provider: config.oauth2.provider,
    clientId: config.oauth2.clientId,
    clientSecret: config.oauth2.clientSecret,
    authorizationUrl: config.oauth2.authorizationUrl,
    tokenUrl: config.oauth2.tokenUrl,
    userInfoUrl: config.oauth2.userInfoUrl,
    redirectUri: config.oauth2.redirectUri,
    scopes: config.oauth2.scopes,
  });
}

// Initialize authentication service
const authService = new AuthService(userRepository, sessionStore, oauth2Client);

// Initialize other services
const waterfallService = new WaterfallService(config.shadowMode);
const ruleService = new RuleService();
const triageService = new TriageService();

// Initialize database schema
try {
  await initializeAuthSchema(sql);
} catch (error) {
  console.error('Failed to initialize auth schema:', error);
}

// Create Elysia app
const app = new Elysia()
  .use(cors())
  .use(createAuthMiddleware(sessionStore))
  .get('/', ({ isAuthenticated, user }) => ({
    name: 'Molen Fraud-Ops Control Plane API',
    version: '1.0.0',
    platform: 'Self-Service IDP for Fraud Analysts',
    stack: 'Kafka + Kafka Connect + Bun/ElysiaJS',
    status: 'running',
    authenticated: isAuthenticated,
    user: user ? { email: user.email, fullName: user.fullName } : null,
    shadowMode: waterfallService.getShadowMode(),
    kafkaConnect: process.env.KAFKA_CONNECT_URL || 'http://localhost:4195',
  }))
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
      auth: 'enabled',
    },
  }));

// Register authentication routes
authRoutes(app, authService);

// Register other routes
waterfallRoutes(app, waterfallService);
ruleRoutes(app, ruleService);
triageRoutes(app, triageService);
app.use(mlRoutes);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  await sessionStore.close();
  await userRepository.close();
  await sql.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing connections...');
  await sessionStore.close();
  await userRepository.close();
  await sql.end();
  process.exit(0);
});

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Molen Self-Service Fraud-Ops Platform running on port ${config.port}`);
  console.log(`📊 Shadow Mode: ${config.shadowMode ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔧 Using Mocks: ${config.useMocks ? 'YES' : 'NO'}`);
  console.log(`🔄 Kafka Connect: ${process.env.KAFKA_CONNECT_URL || 'http://localhost:4195'}`);
  console.log(`🔐 Authentication: ENABLED`);
  console.log(`🔑 OAuth2: ${config.oauth2.enabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`💾 Database: ${config.databaseUrl.split('@')[1] || 'connected'}`);
  console.log(`🔴 Redis: ${config.redisUrl.split('@')[1] || 'connected'}`);
  if (config.caCertPath) {
    console.log(`🔒 SSL/TLS enabled with CA cert: ${config.caCertPath}`);
  }
});

export default app;
