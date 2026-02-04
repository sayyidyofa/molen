# Quick Start Guide - Fraud-Ops Control Plane

## Prerequisites

Install Bun (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bash_profile  # or restart your terminal
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sayyidyofa/molen.git
cd molen
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## Running the Demo

To see the system in action without external services:

```bash
# Run the demo script (uses mock implementations)
bun run demo.ts
```

This will:
- Create mock clients for Elasticsearch, Redis, and Flink
- Process sample transactions through the fraud detection waterfall
- Show how the Interface Factory Pattern works
- Demonstrate stateless and velocity rule evaluation

## Running the Full System

### Option 1: Development Mode (Recommended for Testing)

Set `USE_MOCKS=true` in your `.env` file, then:

```bash
# Terminal 1: Start the API server
bun run dev:api

# Terminal 2: Start the UI dashboard
bun run dev:ui
```

Then open http://localhost:5173 in your browser.

### Option 2: Production Mode (Requires External Services)

Set `USE_MOCKS=false` and configure the following in your `.env`:

```env
ELASTIC_URL=https://your-elasticsearch:9200
REDIS_HOST=your-redis-host
REDIS_PORT=6379
FLINK_API_URL=http://your-flink:8081
CA_CERT_PATH=/path/to/your/ca.crt
```

Then run:

```bash
bun run build
bun run dev:api  # or start:api for production
```

## Using the Dashboard

### Waterfall Monitor
- Navigate to the home page
- Toggle Shadow Mode on/off
- Click "Process Test Transaction" to simulate fraud detection
- View real-time evaluation results

### Rule Editor
- Click "Rule Editor" in the navigation
- Adjust rule thresholds (amount limits, velocity limits)
- Click "Publish Changes" to broadcast updates

### Case Triage
- Click "Case Triage" in the navigation
- Set minimum score filter
- Click on cases to view detailed investigation data

## API Usage Examples

### Process a Transaction
```bash
curl -X POST http://localhost:3000/waterfall/process \
  -H "Content-Type: application/json" \
  -d '{
    "id": "txn-123",
    "userId": "user-456",
    "amount": 5000,
    "timestamp": "2024-01-01T12:00:00Z"
  }'
```

### Toggle Shadow Mode
```bash
# Enable shadow mode
curl -X PUT http://localhost:3000/waterfall/shadow-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Check current state
curl http://localhost:3000/waterfall/shadow-mode
```

### Get Flagged Cases
```bash
curl "http://localhost:3000/triage/cases?minScore=60&size=10"
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests for specific package
bun run test:core
bun run test:api
bun run test:ui
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

## Troubleshooting

### "Cannot find module" errors
Make sure you've run `bun install` in the root directory.

### Connection errors with external services
- Check that `USE_MOCKS=true` if you don't have services running
- Verify service URLs in `.env` file
- Ensure CA certificate path is correct for SSL/TLS

### Port already in use
- Change `PORT` in `.env` for the API
- Modify `vite.config.ts` for UI port

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     React/Vite UI                       │
│  (Waterfall Monitor | Rule Editor | Case Triage)       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────┐
│                 Bun/ElysiaJS API                        │
│  (Waterfall Service | Rule Service | Triage Service)   │
└────────────┬─────────┬──────────┬───────────────────────┘
             │         │          │
   ┌─────────▼──┐ ┌────▼─────┐ ┌─▼────────┐
   │ Elasticsearch│ │  Redis   │ │  Flink   │
   │ (Alerts)     │ │ (Velocity)│ │ (Stream) │
   └──────────────┘ └──────────┘ └──────────┘
```

## Next Steps

1. Review the [README.md](README.md) for detailed documentation
2. Check [IMPLEMENTATION.md](IMPLEMENTATION.md) for technical details
3. Explore the code in `packages/core/src` to understand the Interface Factory Pattern
4. Customize rule evaluators in `packages/core/src/rules`
5. Add your own fraud detection rules

## Support

For issues or questions, please open an issue on GitHub.
