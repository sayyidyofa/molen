# Fraud-Ops Control Plane

High-performance fraud detection orchestration system built with Bun, ElysiaJS, React, and Vite.

## Architecture

This project uses a **monorepo architecture** with the following packages:

- **packages/core**: Shared logic, types, and Interface Factory implementations
- **packages/api**: Bun-powered ElysiaJS backend
- **packages/ui**: React/Vite frontend dashboard
- **packages/config**: Shared ESLint, TSConfig, and environment configurations

## Key Features

### Interface Factory Pattern
The system implements the Interface Factory Pattern for:
- **Rule Evaluation** (Stateless and Velocity evaluators)
- **External Service Clients** (Elasticsearch, Redis, Flink)
- Mock implementations for testing

### Shadow Mode (REQ-1.2)
Toggle shadow mode to log fraud scores without interrupting live transaction flow.

### Dashboard Components
1. **Waterfall Monitor** (REQ-3.1): Real-time transaction flow visualization
2. **Rule Editor** (REQ-3.2): Update Postgres-stored thresholds with LavinMQ broadcast
3. **Case Triage** (REQ-3.3): View and investigate flagged transactions

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0

## Installation

```bash
# Install dependencies
bun install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
PORT=3000
SHADOW_MODE=false

# External Services
ELASTIC_URL=https://elasticsearch:9200
REDIS_HOST=localhost
REDIS_PORT=6379
FLINK_API_URL=http://localhost:8081

# Security (REQ-2.3, NFR-1.2)
CA_CERT_PATH=/path/to/homelab-ca.crt

# Testing
USE_MOCKS=true
```

## Development

### Run all services in development mode

```bash
# Terminal 1: Run API server
bun run dev:api

# Terminal 2: Run UI development server
bun run dev:ui
```

The API will be available at `http://localhost:3000` and the UI at `http://localhost:5173`.

### Run individual packages

```bash
# Core package
cd packages/core
bun test

# API package
cd packages/api
bun run dev

# UI package
cd packages/ui
bun run dev
```

## Testing

```bash
# Run all tests
bun test

# Run tests for specific package
bun run test:core
bun run test:api
bun run test:ui
```

### Mock Mode
Set `USE_MOCKS=true` to use mock implementations of external services (REQ-2.2).

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
