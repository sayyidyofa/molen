# Molen: Self-Service Fraud-Ops Platform

**Internal Developer Platform (IDP) for Fraud Strategy Analysts**

Molen empowers fraud analysts to train, test, and deploy ML fraud detection models without writing code. Built on Redpanda + Kafka Connect for flexible, high-performance stream processing.

## 🎯 Key Features

### Self-Service ML Lifecycle
- **Train Models:** Select date ranges, configure hyperparameters, submit training jobs
- **Shadow Mode:** Test candidate models alongside live without production impact
- **Model Comparison:** Compare accuracy, precision, recall, and false positive rates
- **One-Click Promotion:** Promote candidate to live when metrics improve

### Real-Time Fraud Detection
- **15-30ms Latency:** End-to-end transaction processing
- **Kafka Connect:** Declarative YAML-based waterfall pipelines
- **Dynamic Reloading:** Update rules without downtime
- **Comprehensive Audit:** Full trail of model deployments and decisions

## Architecture

**V2.0: Self-Service Platform**

This project uses a **monorepo architecture** with a self-service ML platform:

- **packages/core**: Shared logic, types, and Interface Factory implementations
- **packages/api**: Bun-powered ElysiaJS backend with ML training services
- **packages/ui**: React/Vite dashboard for analysts
- **packages/config**: Shared ESLint, TSConfig, and environment configurations

### Technology Stack

- **Message Broker:** Redpanda (Kafka-compatible, high-performance)
- **Stream Processing:** Kafka Connect (declarative YAML pipelines)
- **API:** Bun + ElysiaJS (3x faster than Node.js)
- **UI:** React + Vite
- **ML Storage:** S3-compatible storage (training data) + Cloudflare R2 (models)
- **Analytics:** Elasticsearch + Kibana
- **State:** Redis (velocity counters)
- **Metadata:** Postgres

See [SELF_SERVICE_ARCHITECTURE.md](./SELF_SERVICE_ARCHITECTURE.md) for detailed architecture diagrams.

## Quick Start

See [SELF_SERVICE_QUICKSTART.md](./SELF_SERVICE_QUICKSTART.md) for detailed setup instructions.

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Docker and Docker Compose

### Installation

```bash
git clone https://github.com/sayyidyofa/molen.git
cd molen
bun install
```

### Environment Setup

Create `.env` file:

```env
# API
PORT=3000
SHADOW_MODE=false

# Redpanda
KAFKA_BROKER_URL=localhost:9092
KAFKA_CONNECT_URL=http://localhost:4195

# Storage
GARAGE_ENDPOINT=https://garage.internal:3900
S3_ENDPOINT=https://r2.cloudflarestorage.com

# Analytics
ELASTIC_URL=https://elastic.bongko.id/
REDIS_URL=redis://localhost:6379

# Testing
USE_MOCKS=true
```

### Start Services

```bash
# Start infrastructure
docker-compose up -d

# Terminal 1: API
bun run dev:api

# Terminal 2: UI
bun run dev:ui
```

Access:
- **API:** http://localhost:3000
- **UI:** http://localhost:5173

## The "Molen Path" - Analyst Workflow

```
1. EXTRACT   → Select 7-day data window from Garage
2. TRAIN     → Configure & submit XGBoost/LightGBM training
3. EVALUATE  → Deploy candidate in Shadow Mode (48-72 hours)
4. COMPARE   → View Live vs Candidate metrics dashboard
5. PROMOTE   → One-click promotion if FP rate improves
```

See [SELF_SERVICE_QUICKSTART.md](./SELF_SERVICE_QUICKSTART.md) for step-by-step guide.

## Key Features

### Self-Service Model Training (REQ-1)
Train fraud detection models without code:
- Select date ranges from historical data
- Configure model type (XGBoost, LightGBM, scikit-learn)
- Submit training job via UI
- Monitor progress in real-time
- View training metrics (accuracy, F1, AUC)

**API Endpoints:**
```bash
POST /ml/training          # Submit training job
GET  /ml/training/:jobId   # Get training status
GET  /ml/models            # List all models
```

### Shadow Mode Deployment (REQ-2)
Test models safely before production:
- Candidate runs alongside live model
- Both predictions logged (no production impact)
- Compare false positive rates
- Agreement rate analysis
- Promote when metrics improve

**API Endpoints:**
```bash
GET  /ml/models/compare    # Compare models
POST /ml/models/:id/promote # Promote to live
```

### Declarative Rule Management (REQ-3)
Update fraud rules via UI:
- YAML-based Kafka Connect pipelines
- Dynamic reload without downtime
- Version control for rule changes
- Audit trail of modifications

**API Endpoints:**
```bash
GET  /rules               # List rules
PUT  /rules/:id           # Update rule
POST /rules/publish       # Reload pipeline
```

### Alert Triage & Audit (REQ-4)
Investigate flagged transactions:
- Search alerts by score, date, model version
- Enrichment data from external services
- Complete audit trail with user IDs
- Model version tracking per decision

**API Endpoints:**
```bash
GET  /triage/cases        # List flagged transactions
GET  /triage/cases/:id    # Case details with audit trail
```

## Testing

```bash
# Run all unit tests
bun test

# Run tests for specific package
bun run test:core
bun run test:api
bun run test:ui

# Run integration tests (requires credentials)
cd packages/core
bun test tests/integration
```

### Mock Mode
Set `USE_MOCKS=true` to use mock implementations of external services (REQ-2.2).

### Integration Tests
- Tests require credentials (via environment variables or GitHub Secrets)
- Designed to work with free-tier services (minimal Redis operations)
- See [INTEGRATION_TEST_GUIDE.md](INTEGRATION_TEST_GUIDE.md) for detailed setup instructions
- See [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md) for configuring CI/CD secrets

## Type Checking and Linting

```bash
# Type check all packages
bun run typecheck

# Type check individual packages
bun run typecheck:core
bun run typecheck:api
bun run typecheck:ui

# Lint all packages
bun run lint

# Lint and auto-fix issues
bun run lint:fix
```

## Building for Production

```bash
# Build all packages
bun run build

# Or build individually
bun run build:core
bun run build:api
bun run build:ui
```

## Project Structure

```
molen/
├── packages/
│   ├── config/           # Shared configurations
│   │   ├── tsconfig.base.json
│   │   └── eslint.config.js
│   ├── core/             # Core business logic
│   │   ├── src/
│   │   │   ├── clients/  # Client interfaces and implementations
│   │   │   ├── rules/    # Rule evaluator implementations
│   │   │   ├── types/    # Shared TypeScript types
│   │   │   └── factories/# Factory implementations
│   │   └── tests/
│   ├── api/              # Backend API
│   │   └── src/
│   │       ├── routes/   # API route handlers
│   │       ├── services/ # Business logic services
│   │       └── index.ts  # Main server entry point
│   └── ui/               # Frontend dashboard
│       └── src/
│           ├── components/  # React components
│           ├── services/    # API client
│           └── App.tsx      # Main app component
├── package.json
└── README.md
```

## API Endpoints

### Waterfall Processing
- `POST /waterfall/process` - Process a transaction through the fraud detection waterfall
- `GET /waterfall/shadow-mode` - Get current shadow mode state
- `PUT /waterfall/shadow-mode` - Toggle shadow mode

### Rule Management
- `GET /rules` - Get all fraud detection rules
- `PUT /rules/:ruleId` - Update a specific rule
- `POST /rules/publish` - Publish rule changes to LavinMQ

### Case Triage
- `GET /triage/cases` - Get flagged transactions (query params: from, size, minScore)
- `GET /triage/cases/:caseId` - Get details for a specific case

## Security

### SSL/TLS Configuration (NFR-1.2)
All communication with Elasticsearch is encrypted and verified against the homelab-CA:
- Set `CA_CERT_PATH` environment variable to your CA certificate path
- The Elasticsearch client automatically configures SSL/TLS

### Audit Logging (NFR-1.3)
All administrative actions are logged to Postgres with authenticated user IDs.

## Requirements Traceability

- **REQ-1.1**: Interface Factory for rule evaluation ✓
- **REQ-1.2**: Shadow Mode toggle ✓
- **REQ-2.1**: Client Factory for external integrations ✓
- **REQ-2.2**: Mock implementations for testing ✓
- **REQ-2.3**: Elasticsearch SSL/TLS support ✓
- **REQ-3.1**: Waterfall Monitor component ✓
- **REQ-3.2**: Rule Editor component ✓
- **REQ-3.3**: Case Triage component ✓
- **NFR-1.1**: Bun runtime for maximum performance ✓
- **NFR-1.2**: SSL/TLS encryption ✓
- **NFR-1.3**: Audit logging architecture ✓

## License

MIT
