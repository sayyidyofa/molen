# Molen Self-Service Platform - Quick Start Guide

## Overview

Molen is a Self-Service Internal Developer Platform (IDP) that empowers Fraud Strategy Analysts to train, test, and deploy fraud detection models without writing code.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Docker and Docker Compose (for local development)
- Access to Redpanda, Garage S3, Elasticsearch, and Redis

## Quick Setup

### 1. Clone and Install

```bash
git clone https://github.com/sayyidyofa/molen.git
cd molen
bun install
```

### 2. Configure Environment

Create `.env` file:

```env
# API Configuration
PORT=3000
SHADOW_MODE=false
USE_MOCKS=true

# Redpanda (Message Broker)
REDPANDA_BROKER_URL=localhost:9092
REDPANDA_CONNECT_URL=http://localhost:4195

# Storage
GARAGE_ENDPOINT=https://garage.internal:3900
GARAGE_ACCESS_KEY_ID=your_access_key
GARAGE_SECRET_ACCESS_KEY=your_secret_key
GARAGE_TRAINING_BUCKET=training-data

S3_ENDPOINT=https://r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your_r2_key
S3_SECRET_ACCESS_KEY=your_r2_secret
S3_BUCKET=ml-models

# Analytics
ELASTIC_URL=https://elastic.bongko.id/
ELASTIC_USERNAME=your_username
ELASTIC_PASSWORD=your_password

REDIS_URL=redis://default:password@redis.example.com:12394
```

### 3. Start Infrastructure (Docker)

```bash
docker-compose up -d redpanda redpanda-connect
```

### 4. Start Molen Services

```bash
# Terminal 1: Start API
cd packages/api
bun run dev

# Terminal 2: Start UI
cd packages/ui
bun run dev
```

Access:
- **API:** http://localhost:3000
- **UI:** http://localhost:5173

---

## The "Molen Path" - Your First Model

### Step 1: Extract Training Data

1. Navigate to **Model Training** in the UI
2. Select date range (e.g., last 7 days)
3. Click **Extract Data**
4. Wait for Parquet files to be saved to Garage

**API Alternative:**
```bash
curl -X POST http://localhost:3000/ml/training \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "fraud-detector-v1",
    "modelType": "xgboost",
    "dataSource": {
      "startDate": "2026-02-01",
      "endDate": "2026-02-07",
      "bucket": "training-data"
    }
  }'
```

### Step 2: Train Model

The training job starts automatically after data extraction.

**Monitor Progress:**
```bash
# Get job ID from Step 1 response
curl http://localhost:3000/ml/training/{jobId}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "jobId": "job-123",
    "status": "completed",
    "metrics": {
      "accuracy": 0.92,
      "precision": 0.89,
      "recall": 0.87,
      "f1Score": 0.88,
      "auc": 0.94
    },
    "artifactPath": "s3://ml-models/trained/fraud-detector-v1.bin"
  }
}
```

### Step 3: Deploy in Shadow Mode

1. Navigate to **Models** → **Candidates**
2. Find your new model
3. Click **Deploy Shadow Mode**
4. Set duration: 48-72 hours

**API Alternative:**
```bash
# Shadow deployment is automatic for newly trained models
# Models are created as "candidate" type by default
```

### Step 4: Compare Performance

1. Navigate to **Model Comparison**
2. Select Live vs Candidate
3. View metrics:
   - Accuracy delta
   - False Positive Rate
   - Agreement Rate

**API Alternative:**
```bash
curl "http://localhost:3000/ml/models/compare?liveModelId=model-1&candidateModelId=model-2"
```

**Response:**
```json
{
  "success": true,
  "comparison": {
    "liveModel": { ... },
    "candidateModel": { ... },
    "comparison": {
      "accuracyDelta": 0.03,
      "falsePositiveDelta": -0.04
    },
    "recommendation": "promote",
    "shadowModeResults": {
      "totalTransactions": 10000,
      "agreementRate": 0.95,
      "candidateFalsePositives": 110,
      "liveFalsePositives": 150
    }
  }
}
```

### Step 5: Promote to Live

If the False Positive rate improved:

1. Click **Promote to Live** button
2. Confirm promotion
3. Old live model is automatically archived
4. Redpanda Connect pipeline reloads with new model

**API Alternative:**
```bash
curl -X POST http://localhost:3000/ml/models/{modelId}/promote
```

---

## Using Shadow Mode

### What is Shadow Mode?

Shadow Mode allows you to test a new model (candidate) alongside your current model (live) without affecting production decisions.

- ✅ Candidate predictions are logged but **not used** for blocking
- ✅ Live model continues to make real decisions
- ✅ Compare performance before promoting

### Toggle Shadow Mode

```bash
# Enable shadow mode
curl -X PUT http://localhost:3000/waterfall/shadow-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Check status
curl http://localhost:3000/waterfall/shadow-mode
```

### Shadow Mode Duration

Recommended:
- **24 hours minimum** - Capture daily patterns
- **48-72 hours ideal** - Include weekday + weekend
- **7 days maximum** - Enough data for comparison

---

## Managing Rules

### Update Thresholds

1. Navigate to **Rule Editor**
2. Modify thresholds (e.g., high amount check)
3. Click **Publish**
4. Redpanda Connect pipeline automatically reloads

**API Alternative:**
```bash
curl -X PUT http://localhost:3000/rules/{ruleId} \
  -H "Content-Type: application/json" \
  -d '{
    "threshold": 10000,
    "scoreWeight": 25
  }'

# Publish changes (reloads Redpanda Connect)
curl -X POST http://localhost:3000/rules/publish
```

---

## Investigating Alerts

### View Flagged Transactions

1. Navigate to **Case Triage**
2. Filter by:
   - Date range
   - Fraud score
   - Model version

**API Alternative:**
```bash
curl "http://localhost:3000/triage/cases?from=2026-02-01&size=50&minScore=70"
```

### Case Details

```bash
curl http://localhost:3000/triage/cases/{caseId}
```

**Response includes:**
- Transaction details
- Fraud score breakdown
- Model version used
- Evaluation logs
- Enrichment data

---

## Testing with Mocks

For local development without external services:

```env
USE_MOCKS=true
```

**What's Mocked:**
- ✅ ML Training (instant completion)
- ✅ Model storage (in-memory)
- ✅ Redpanda Connect (in-memory pipelines)
- ✅ Elasticsearch (in-memory store)
- ✅ Redis (in-memory cache)
- ✅ S3/Garage (in-memory blobs)

**Run Tests:**
```bash
# Unit tests
bun test

# Integration tests (requires real services)
cd packages/core
bun test tests/integration
```

---

## Common Commands

### Development

```bash
# Start all services
bun run dev

# Start individual packages
bun run dev:api
bun run dev:ui

# Type checking
bun run typecheck

# Linting
bun run lint
```

### Production Build

```bash
bun run build
```

### Model Management

```bash
# List all models
curl http://localhost:3000/ml/models

# List only live models
curl "http://localhost:3000/ml/models?type=live"

# List only candidate models
curl "http://localhost:3000/ml/models?type=candidate"

# Archive a model
curl -X POST http://localhost:3000/ml/models/{modelId}/archive
```

### Training Jobs

```bash
# List recent training jobs
curl http://localhost:3000/ml/training

# Cancel a running job
curl -X DELETE http://localhost:3000/ml/training/{jobId}
```

---

## Architecture Components

### Redpanda (Message Broker)
- **Purpose:** Ingest transaction events
- **Topic:** `transactions`
- **Performance:** 10M+ msgs/sec

### Redpanda Connect (Waterfall Engine)
- **Purpose:** Stream processing pipeline
- **Configuration:** YAML-based
- **Reload:** Dynamic without downtime

### Garage S3 (Training Data)
- **Purpose:** Store Parquet training datasets
- **Bucket:** `training-data`
- **Format:** Parquet (columnar, optimized)

### S3/R2 (Model Storage)
- **Purpose:** Store trained model binaries
- **Bucket:** `ml-models`
- **Format:** `.bin`, `.pkl`, `.onnx`

### Elasticsearch (Analytics)
- **Purpose:** Alert storage and search
- **Indexes:** `fraud-alerts`, `evaluation-logs`

### Redis (Hot State)
- **Purpose:** Velocity counters
- **Keys:** `user:{userId}:txn:count:{window}`

### Postgres (Metadata)
- **Purpose:** Model versions, audit logs
- **Tables:** `models`, `training_jobs`, `audit_log`

---

## Troubleshooting

### API won't start

```bash
# Check if port is already in use
lsof -i :3000

# Check environment variables
env | grep REDPANDA

# Check logs
tail -f packages/api/logs/error.log
```

### Training job fails

```bash
# Check job status
curl http://localhost:3000/ml/training/{jobId}

# Common issues:
# 1. Invalid date range (no data in Garage)
# 2. Insufficient data (< 1000 samples)
# 3. Missing features in dataset
```

### Model comparison shows no data

```bash
# Ensure candidate model ran in shadow mode for at least 24 hours
# Check Elasticsearch for shadow predictions:
curl -X POST "http://localhost:9200/evaluation-logs/_search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": {
      "match": {
        "modelType": "candidate"
      }
    }
  }'
```

### Redpanda Connect pipeline not reloading

```bash
# Check Redpanda Connect status
curl http://localhost:4195/ready

# Manual reload
curl -X POST http://localhost:3000/rules/publish

# Check pipeline logs
docker logs redpanda-connect
```

---

## Next Steps

1. **Read Full Architecture:** [SELF_SERVICE_ARCHITECTURE.md](./SELF_SERVICE_ARCHITECTURE.md)
2. **Explore API Docs:** [API Reference](#) (coming soon)
3. **Join Slack:** #molen-platform
4. **Report Issues:** [GitHub Issues](https://github.com/sayyidyofa/molen/issues)

---

## Support

- **Documentation:** [./docs](./docs)
- **Architecture:** [SELF_SERVICE_ARCHITECTURE.md](./SELF_SERVICE_ARCHITECTURE.md)
- **API Reference:** [Swagger UI](http://localhost:3000/swagger) (when API is running)
- **Slack:** #molen-support

---

## License

MIT
