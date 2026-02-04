import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { loadConfig } from './config';
import { WaterfallService } from './services/waterfall.service';
import { RuleService } from './services/rule.service';
import { TriageService } from './services/triage.service';
import { waterfallRoutes } from './routes/waterfall.routes';
import { ruleRoutes } from './routes/rule.routes';
import { triageRoutes } from './routes/triage.routes';

/**
 * Fraud-Ops Control Plane API Server
 * Built with Bun and ElysiaJS for maximum performance (NFR-1.1)
 */

// Load configuration
const config = loadConfig();

// Initialize services
const waterfallService = new WaterfallService(config.shadowMode);
const ruleService = new RuleService();
const triageService = new TriageService();

// Create Elysia app
const app = new Elysia()
  .use(cors())
  .get('/', () => ({
    name: 'Fraud-Ops Control Plane API',
    version: '0.1.0',
    status: 'running',
    shadowMode: waterfallService.getShadowMode(),
  }))
  .get('/health', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }));

// Register routes
waterfallRoutes(app, waterfallService);
ruleRoutes(app, ruleService);
triageRoutes(app, triageService);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Fraud-Ops Control Plane API running on port ${config.port}`);
  console.log(`📊 Shadow Mode: ${config.shadowMode ? 'ENABLED' : 'DISABLED'}`);
  console.log(`🔧 Using Mocks: ${config.useMocks ? 'YES' : 'NO'}`);
  if (config.caCertPath) {
    console.log(`🔒 SSL/TLS enabled with CA cert: ${config.caCertPath}`);
  }
});

export default app;
