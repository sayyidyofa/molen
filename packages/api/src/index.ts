import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { loadConfig } from './config';
import { WaterfallService } from './services/waterfall.service';
import { RuleService } from './services/rule.service';
import { TriageService } from './services/triage.service';
import { MLService } from './services/ml.service';
import { waterfallRoutes } from './routes/waterfall.routes';
import { ruleRoutes } from './routes/rule.routes';
import { triageRoutes } from './routes/triage.routes';
import { mlRoutes } from './routes/ml.routes';

/**
 * Molen Fraud-Ops Control Plane API Server
 * Self-Service Internal Developer Platform for Fraud Analysts
 * Built with Bun and ElysiaJS for maximum performance (NFR-1.1)
 */

// Load configuration
const config = loadConfig();

// Initialize services
const waterfallService = new WaterfallService(config.shadowMode);
const ruleService = new RuleService();
const triageService = new TriageService();
const mlService = new MLService();

// Create Elysia app
const app = new Elysia()
  .use(cors())
  .get('/', () => ({
    name: 'Molen Fraud-Ops Control Plane API',
    version: '1.0.0',
    platform: 'Self-Service IDP for Fraud Analysts',
    stack: 'Redpanda + Redpanda Connect + Bun/ElysiaJS',
    status: 'running',
    shadowMode: waterfallService.getShadowMode(),
    redpandaConnect: process.env.REDPANDA_CONNECT_URL || 'http://localhost:4195',
  }))
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }));

// Register routes
waterfallRoutes(app, waterfallService);
ruleRoutes(app, ruleService);
triageRoutes(app, triageService);
app.use(mlRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Molen Self-Service Fraud-Ops Platform running on port ${config.port}`);
  console.log(`📊 Shadow Mode: ${config.shadowMode ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔧 Using Mocks: ${config.useMocks ? 'YES' : 'NO'}`);
  console.log(`🔄 Redpanda Connect: ${process.env.REDPANDA_CONNECT_URL || 'http://localhost:4195'}`);
  if (config.caCertPath) {
    console.log(`🔒 SSL/TLS enabled with CA cert: ${config.caCertPath}`);
  }
});

export default app;
