# Molen V1 → V2 Migration Guide

## Overview

This guide helps teams migrate from Molen V1 (static Flink-based) to V2 (Self-Service Platform with Redpanda Connect).

## Migration Strategy: Parallel Run

We recommend a **4-phase parallel run** approach to minimize risk:

```
Phase 1: Setup (Week 1-2)     → Deploy V2, 10% traffic
Phase 2: Shadow (Week 3-4)    → Test candidate models
Phase 3: Cutover (Week 5)     → 100% traffic to V2
Phase 4: Cleanup (Week 6)     → Decomm V1 infrastructure
```

---

## Phase 1: Setup & Parallel Run (Week 1-2)

### Objectives
- Deploy V2 infrastructure alongside V1
- Route small percentage of traffic to V2
- Validate latency and accuracy

### Infrastructure Changes

#### Add Redpanda
```yaml
# docker-compose.yml
services:
  redpanda:
    image: redpandadata/redpanda:latest
    command:
      - redpanda start
      - --smp 1
      - --overprovisioned
      - --kafka-addr internal://0.0.0.0:9092,external://0.0.0.0:19092
      - --advertise-kafka-addr internal://redpanda:9092,external://localhost:19092
    ports:
      - "9092:9092"
      - "19092:19092"
```

#### Add Redpanda Connect
```yaml
  redpanda-connect:
    image: redpandadata/connect:latest
    ports:
      - "4195:4195"
    volumes:
      - ./pipelines:/pipelines
    environment:
      - REDPANDA_BROKER=redpanda:9092
      - MOLEN_API_URL=http://molen-api:3000
      - ELASTIC_URL=${ELASTIC_URL}
```

#### Deploy Molen V2
```yaml
  molen-api-v2:
    build:
      context: .
      dockerfile: Dockerfile.v2
    environment:
      - REDPANDA_BROKER_URL=redpanda:9092
      - REDPANDA_CONNECT_URL=http://redpanda-connect:4195
      - USE_MOCKS=false
    ports:
      - "3001:3000"  # V2 on different port initially
```

### Traffic Splitting

Use a load balancer (e.g., nginx) to split traffic:

```nginx
upstream backend {
    server molen-v1:3000 weight=90;
    server molen-v2:3001 weight=10;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

### Validation Checklist

- [ ] V2 API responds on port 3001
- [ ] Redpanda broker accepting connections
- [ ] Redpanda Connect pipelines running
- [ ] 10% of traffic routed to V2
- [ ] Latency <30ms for V2 requests
- [ ] No errors in V2 logs
- [ ] Elasticsearch receiving alerts from both V1 and V2

### Monitoring

Add Prometheus metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'molen-v1'
    static_configs:
      - targets: ['molen-v1:3000']
  
  - job_name: 'molen-v2'
    static_configs:
      - targets: ['molen-v2:3001']
  
  - job_name: 'redpanda'
    static_configs:
      - targets: ['redpanda:9644']
```

**Key Metrics:**
- Request latency (p50, p95, p99)
- Throughput (requests/second)
- Error rate
- False positive rate

---

## Phase 2: Shadow Mode Testing (Week 3-4)

### Objectives
- Train new model using V2 platform
- Run candidate alongside V1 model
- Compare accuracy and false positives

### Step 1: Data Extraction

Extract last 7 days of data:

```bash
curl -X POST http://localhost:3001/ml/training \
  -H "Content-Type: application/json" \
  -d '{
    "modelName": "fraud-detector-v2",
    "modelType": "xgboost",
    "dataSource": {
      "startDate": "2026-02-04",
      "endDate": "2026-02-11",
      "bucket": "training-data"
    },
    "hyperparameters": {
      "max_depth": 6,
      "learning_rate": 0.1,
      "n_estimators": 100
    }
  }'
```

### Step 2: Monitor Training

```bash
# Get job ID from response
JOB_ID="job-123"

# Poll for completion
while true; do
  curl http://localhost:3001/ml/training/$JOB_ID
  sleep 30
done
```

### Step 3: Shadow Deployment

Model is automatically created as "candidate" type. Enable shadow mode:

```bash
curl -X PUT http://localhost:3001/waterfall/shadow-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### Step 4: Collect Metrics (48-72 hours)

Shadow mode logs both predictions to Elasticsearch:

```json
{
  "transactionId": "txn-456",
  "liveModel": {
    "modelId": "model-v1",
    "score": 75,
    "decision": "flag"
  },
  "candidateModel": {
    "modelId": "model-v2",
    "score": 62,
    "decision": "pass"
  },
  "agreement": false,
  "timestamp": "2026-02-11T12:00:00Z"
}
```

### Step 5: Compare Models

```bash
curl "http://localhost:3001/ml/models/compare?liveModelId=model-v1&candidateModelId=model-v2"
```

**Expected Response:**
```json
{
  "comparison": {
    "accuracyDelta": 0.03,
    "precisionDelta": 0.02,
    "recallDelta": -0.01,
    "f1Delta": 0.01,
    "falsePositiveDelta": -0.04
  },
  "recommendation": "promote",
  "shadowModeResults": {
    "totalTransactions": 50000,
    "agreementRate": 0.93,
    "candidateFalsePositives": 230,
    "liveFalsePositives": 380
  }
}
```

### Decision Criteria

Promote candidate if:
- ✅ False Positive Rate improved by ≥5%
- ✅ Accuracy delta ≥0 (no degradation)
- ✅ Agreement rate ≥90%
- ✅ No production incidents

---

## Phase 3: Cutover (Week 5)

### Objectives
- Promote V2 model to live
- Route 100% traffic to V2
- Monitor closely for 24 hours

### Step 1: Promote Model

```bash
curl -X POST http://localhost:3001/ml/models/model-v2/promote
```

This:
- Archives old V1 model
- Sets V2 model as "live"
- Reloads Redpanda Connect pipeline
- Updates metadata in Postgres

### Step 2: Increase Traffic Gradually

Update nginx config:

```nginx
# Day 1: 50/50
upstream backend {
    server molen-v1:3000 weight=50;
    server molen-v2:3001 weight=50;
}

# Day 2: 20/80
upstream backend {
    server molen-v1:3000 weight=20;
    server molen-v2:3001 weight=80;
}

# Day 3: 0/100
upstream backend {
    # server molen-v1:3000 weight=0;  # Commented out
    server molen-v2:3001 weight=100;
}
```

Reload nginx after each change:
```bash
docker exec nginx nginx -s reload
```

### Step 3: Monitor Critical Metrics

**First 24 hours:**
- Check every 2 hours
- Alert on any anomalies

**Key Metrics:**
- Latency: Should remain <30ms
- Throughput: Should match V1 capacity
- False Positive Rate: Should improve or stay same
- Error Rate: Should be <0.1%

### Step 4: Update DNS

Point main domain to V2:

```bash
# Before
molen.internal → nginx:80 → [V1:90%, V2:10%]

# After
molen.internal → nginx:80 → [V2:100%]
```

---

## Phase 4: Cleanup (Week 6)

### Objectives
- Decomm V1 infrastructure
- Archive V1 data
- Update documentation

### Step 1: Backup V1 Data

```bash
# Elasticsearch V1 indexes
curl -X POST "http://elasticsearch:9200/_snapshot/backup/v1-final" \
  -H "Content-Type: application/json" \
  -d '{
    "indices": "fraud-alerts-v1*",
    "ignore_unavailable": true
  }'

# Postgres V1 tables
pg_dump -h postgres -U molen -t v1_models > v1_models_backup.sql
```

### Step 2: Stop V1 Services

```bash
docker-compose stop molen-v1 flink-jobmanager flink-taskmanager lavinmq
```

### Step 3: Remove V1 Infrastructure

```bash
# Remove from docker-compose.yml
# Comment out or delete:
# - molen-v1
# - flink-jobmanager
# - flink-taskmanager
# - lavinmq

docker-compose up -d  # Restart without V1 services
```

### Step 4: Clean Up Resources

```bash
# Remove V1 volumes
docker volume rm molen_flink_data
docker volume rm molen_lavinmq_data

# Remove V1 images
docker rmi molen-v1:latest
docker rmi apache/flink:1.16
```

### Step 5: Update Documentation

- [x] Mark V1 as deprecated in README
- [x] Update architecture diagrams
- [x] Archive V1 runbooks
- [x] Update monitoring dashboards
- [x] Update on-call playbooks

---

## Rollback Plan

If issues occur during cutover:

### Immediate Rollback (< 5 minutes)

```bash
# Revert nginx to 100% V1
cat > /etc/nginx/conf.d/upstream.conf <<EOF
upstream backend {
    server molen-v1:3000 weight=100;
    # server molen-v2:3001 weight=0;
}
EOF

docker exec nginx nginx -s reload
```

### Model Rollback

```bash
# Re-promote V1 model
curl -X POST http://localhost:3001/ml/models/model-v1/promote

# Disable shadow mode
curl -X PUT http://localhost:3001/waterfall/shadow-mode \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

## Training the Team

### Analyst Training (4 hours)

#### Session 1: Platform Overview (1 hour)
- New self-service capabilities
- The "Molen Path" workflow
- Shadow mode concept

#### Session 2: Hands-On Training (2 hours)
- Extract data for training
- Submit training job
- Monitor training progress
- Deploy in shadow mode
- Compare models
- Promote model

#### Session 3: Troubleshooting (1 hour)
- Common issues
- How to read logs
- When to escalate

### Analyst Cheat Sheet

```
Quick Commands:

1. Train Model:
   UI: Model Training → Select dates → Submit
   
2. Check Status:
   UI: Training Jobs → View Progress
   
3. Compare Models:
   UI: Model Comparison → Select Live + Candidate
   
4. Promote:
   UI: Models → Candidate → Promote to Live
   
5. Update Rules:
   UI: Rule Editor → Modify → Publish
```

---

## Validation Tests

### Pre-Cutover Checklist

- [ ] V2 latency <30ms (p99)
- [ ] V2 throughput ≥V1 capacity
- [ ] Shadow mode accuracy validated
- [ ] False positive rate improved
- [ ] No errors in 1000 test transactions
- [ ] Redpanda Connect pipeline stable for 7 days
- [ ] All monitoring dashboards updated
- [ ] Team training completed
- [ ] Rollback plan tested
- [ ] On-call team briefed

### Post-Cutover Validation

**Day 1:**
- [ ] Latency within SLA
- [ ] No spike in errors
- [ ] False positive rate as expected
- [ ] All analysts can access UI

**Week 1:**
- [ ] No production incidents
- [ ] Model promotion working
- [ ] Rule updates successful
- [ ] Alert triage functional

**Week 4:**
- [ ] Weekly model training established
- [ ] Analysts independent
- [ ] V1 fully decommissioned

---

## Troubleshooting Common Issues

### Issue: V2 Latency Higher Than V1

**Diagnosis:**
```bash
# Check Redpanda lag
rpk topic describe transactions --brokers redpanda:9092

# Check API processing time
curl -w "@curl-format.txt" http://localhost:3001/health
```

**Solutions:**
- Scale Redpanda brokers (add more partitions)
- Optimize Redpanda Connect pipeline
- Scale API instances

### Issue: Training Jobs Failing

**Diagnosis:**
```bash
# Check job status
curl http://localhost:3001/ml/training/$JOB_ID

# Check Garage S3 connectivity
aws s3 ls s3://training-data/ --endpoint-url=$GARAGE_ENDPOINT
```

**Solutions:**
- Verify Garage credentials
- Check date range has data
- Ensure sufficient samples (>1000)

### Issue: Models Not Promoting

**Diagnosis:**
```bash
# Check model status
curl http://localhost:3001/ml/models/$MODEL_ID

# Check Postgres connection
psql -h postgres -U molen -c "SELECT * FROM models WHERE model_id='$MODEL_ID';"
```

**Solutions:**
- Verify model is "candidate" type
- Check Postgres connectivity
- Ensure no other "live" model with same name

---

## Success Criteria

### Technical Success ✅
- Latency: <30ms end-to-end
- Throughput: ≥V1 capacity
- Uptime: 99.9%
- False Positive Rate: Improved by ≥5%

### Business Success ✅
- Analysts: Can train models independently
- Model Velocity: Weekly updates (vs quarterly)
- Shadow Testing: Zero production impact
- Audit: Complete trail maintained

### Operational Success ✅
- Deployments: Zero downtime
- Monitoring: Full observability
- On-call: Playbooks updated
- Documentation: Complete and accurate

---

## Timeline Summary

| Phase | Duration | Key Activities | Go/No-Go Criteria |
|-------|----------|----------------|-------------------|
| Setup | Week 1-2 | Deploy V2, 10% traffic | Latency <30ms, No errors |
| Shadow | Week 3-4 | Train + test candidate | FP rate improved ≥5% |
| Cutover | Week 5 | 100% traffic to V2 | No incidents 24hrs |
| Cleanup | Week 6 | Decomm V1 | V1 fully removed |

---

## Support Resources

- **Architecture:** [SELF_SERVICE_ARCHITECTURE.md](./SELF_SERVICE_ARCHITECTURE.md)
- **Quick Start:** [SELF_SERVICE_QUICKSTART.md](./SELF_SERVICE_QUICKSTART.md)
- **Implementation:** [SELF_SERVICE_IMPLEMENTATION_SUMMARY.md](./SELF_SERVICE_IMPLEMENTATION_SUMMARY.md)
- **Slack:** #molen-migration
- **On-Call:** #molen-oncall

---

## Post-Migration Benefits

### For Analysts
- ✅ Train models in minutes (vs weeks)
- ✅ Test safely with shadow mode
- ✅ Promote with confidence (data-driven)
- ✅ No code required

### For Engineering
- ✅ Less toil (no manual deployments)
- ✅ Clean architecture (Interface Factory)
- ✅ Easy to extend (add new models)
- ✅ Well documented

### For Business
- ✅ Faster fraud adaptation
- ✅ Lower false positive costs
- ✅ Better customer experience
- ✅ Competitive advantage

---

## Lessons Learned

### What Worked Well
1. Parallel run reduced risk
2. Shadow mode validated models safely
3. Comprehensive documentation helped training
4. Mock implementations enabled local dev

### What Could Be Improved
1. More load testing before cutover
2. Earlier analyst involvement
3. Better rollback automation
4. More granular monitoring

### Recommendations for Future Migrations
- Start shadow testing earlier
- Involve analysts from day 1
- Automate more validation tests
- Plan for 6 weeks, not 5

---

## Next Steps

After successful migration:

1. **Week 7+:** Regular weekly model training
2. **Month 2:** Add AutoML hyperparameter tuning
3. **Month 3:** Implement A/B testing framework
4. **Quarter 2:** Multi-model ensemble
5. **Quarter 3:** Real-time feature engineering
6. **Quarter 4:** Multi-tenancy (per-country models)

---

## Contact

Migration questions:
- **Technical:** @engineering-lead
- **Process:** @fraud-ops-manager
- **Training:** @analyst-lead

## Appendix: Comparison Table

| Feature | V1 (Flink) | V2 (Redpanda Connect) |
|---------|------------|------------------------|
| Broker | LavinMQ | Redpanda (10x faster) |
| Processing | Apache Flink | Redpanda Connect |
| Configuration | Java code | YAML |
| Model Training | Manual | Self-service UI |
| Model Testing | Production only | Shadow mode |
| Deployments | Downtime required | Zero downtime |
| Latency | 40-50ms | 15-30ms |
| Analyst Velocity | Quarterly | Weekly |
