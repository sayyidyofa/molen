# Naming Convention Migration Guide

## Overview

This guide helps you migrate from vendor-specific naming (Redpanda, Garage, R2, Flink) to generic, vendor-neutral naming (Kafka, S3-compatible). This change makes Molen more portable and compatible with various implementations.

## Why This Change?

- **Vendor Neutral**: Works with Kafka, Redpanda, Confluent, Amazon MSK, etc.
- **Portable**: Easy to switch between different implementations
- **Industry Standard**: Uses widely recognized terminology (Kafka, S3)
- **Simplified**: Removed legacy components (Flink)

## Quick Reference

### Environment Variables

| Old Name | New Name | Notes |
|----------|----------|-------|
| `REDPANDA_BROKERS` | `KAFKA_BROKERS` | Works with any Kafka-compatible broker |
| `REDPANDA_USERNAME` | `KAFKA_USERNAME` | - |
| `REDPANDA_PASSWORD` | `KAFKA_PASSWORD` | - |
| `REDPANDA_SASL_MECHANISM` | `KAFKA_SASL_MECHANISM` | - |
| `REDPANDA_CONNECT_URL` | `KAFKA_CONNECT_URL` | Kafka Connect compatible |
| `REDPANDA_CONNECT_API_KEY` | `KAFKA_CONNECT_API_KEY` | - |
| `FLINK_URL` | ❌ Removed | Replaced by Kafka Connect |
| `FLINK_CLIENT_ID` | ❌ Removed | - |
| `FLINK_CLIENT_SECRET` | ❌ Removed | - |
| `GARAGE_*` | ❌ Removed | Use generic `S3_*` variables |

### TypeScript Interfaces

| Old Interface | New Interface |
|--------------|---------------|
| `IRedpandaBrokerClient` | `IKafkaBrokerClient` |
| `IRedpandaConnectClient` | `IKafkaConnectClient` |
| `RedpandaBrokerConfig` | `KafkaBrokerConfig` |
| `RedpandaConnectConfig` | `KafkaConnectConfig` |
| `IFlinkClient` | ❌ Removed |

### Factory Methods

| Old Method | New Method |
|-----------|------------|
| `ExternalClientFactory.createRedpandaBrokerClient()` | `ExternalClientFactory.createKafkaBrokerClient()` |
| `ExternalClientFactory.createRedpandaConnectClient()` | `ExternalClientFactory.createKafkaConnectClient()` |
| `ExternalClientFactory.createFlinkClient()` | ❌ Removed |

### Class Names

| Old Class | New Class |
|-----------|-----------|
| `MockRedpandaBrokerClient` | `MockKafkaBrokerClient` |
| `RealRedpandaBrokerClient` | `RealKafkaBrokerClient` |
| `MockRedpandaConnectClient` | `MockKafkaConnectClient` |
| `MockFlinkClient` | ❌ Removed |
| `RealFlinkClient` | ❌ Removed |

### File Names

| Old File | New File |
|----------|----------|
| `redpanda.interface.ts` | `kafka.interface.ts` |
| `redpanda.mock.ts` | `kafka.mock.ts` |
| `redpanda-broker.interface.ts` | `kafka-broker.interface.ts` |
| `redpanda-broker.mock.ts` | `kafka-broker.mock.ts` |
| `redpanda-broker.real.ts` | `kafka-broker.real.ts` |
| `flink.interface.ts` | ❌ Removed |
| `flink.mock.ts` | ❌ Removed |
| `flink.real.ts` | ❌ Removed |

## Migration Steps

### Step 1: Update Environment Variables

**Local Development (.env file):**
```bash
# Old
REDPANDA_BROKERS=localhost:9092
REDPANDA_USERNAME=user
REDPANDA_PASSWORD=pass
REDPANDA_SASL_MECHANISM=scram-sha-256
FLINK_URL=http://localhost:8081

# New
KAFKA_BROKERS=localhost:9092
KAFKA_USERNAME=user
KAFKA_PASSWORD=pass
KAFKA_SASL_MECHANISM=scram-sha-256
# FLINK_URL removed - use Kafka Connect instead
```

**GitHub Secrets:**

Remove old secrets:
- `REDPANDA_BROKERS`
- `REDPANDA_USERNAME`
- `REDPANDA_PASSWORD`
- `REDPANDA_SASL_MECHANISM`
- `FLINK_URL`
- `FLINK_CLIENT_ID`
- `FLINK_CLIENT_SECRET`

Add new secrets:
- `KAFKA_BROKERS`
- `KAFKA_USERNAME`
- `KAFKA_PASSWORD`
- `KAFKA_SASL_MECHANISM`

**Kubernetes Secrets:**
```bash
# Delete old secrets
kubectl delete secret molen-secrets -n your-namespace

# Create new secrets with updated names
kubectl create secret generic molen-secrets \
  --from-literal=KAFKA_BROKERS="your-broker:9092" \
  --from-literal=KAFKA_USERNAME="your-username" \
  --from-literal=KAFKA_PASSWORD="your-password" \
  --from-literal=KAFKA_SASL_MECHANISM="scram-sha-256" \
  -n your-namespace
```

### Step 2: Update Code Imports

**Old:**
```typescript
import { 
  IRedpandaBrokerClient,
  IRedpandaConnectClient,
  IFlinkClient 
} from '@molen/core';

const broker = ExternalClientFactory.createRedpandaBrokerClient();
const connect = ExternalClientFactory.createRedpandaConnectClient();
const flink = ExternalClientFactory.createFlinkClient();
```

**New:**
```typescript
import { 
  IKafkaBrokerClient,
  IKafkaConnectClient
} from '@molen/core';

const broker = ExternalClientFactory.createKafkaBrokerClient();
const connect = ExternalClientFactory.createKafkaConnectClient();
// Flink removed - use Kafka Connect for processing
```

### Step 3: Update Configuration Files

**Docker Compose:**
```yaml
# Old
environment:
  - REDPANDA_BROKERS=kafka:9092
  - FLINK_URL=http://flink:8081

# New
environment:
  - KAFKA_BROKERS=kafka:9092
  # FLINK_URL removed
```

**Kubernetes Manifests:**
```yaml
# Old
env:
  - name: REDPANDA_BROKERS
    valueFrom:
      secretKeyRef:
        name: molen-secrets
        key: REDPANDA_BROKERS

# New
env:
  - name: KAFKA_BROKERS
    valueFrom:
      secretKeyRef:
        name: molen-secrets
        key: KAFKA_BROKERS
```

### Step 4: Update CI/CD Pipelines

**GitHub Actions:**
```yaml
# Old
env:
  REDPANDA_BROKERS: ${{ secrets.REDPANDA_BROKERS }}
  FLINK_URL: ${{ secrets.FLINK_URL }}

# New
env:
  KAFKA_BROKERS: ${{ secrets.KAFKA_BROKERS }}
  # FLINK_URL removed
```

### Step 5: Verify Tests

Run integration tests with new environment variables:
```bash
export KAFKA_BROKERS="your-broker:9092"
export KAFKA_USERNAME="your-username"
export KAFKA_PASSWORD="your-password"
export KAFKA_SASL_MECHANISM="scram-sha-256"

cd packages/core
bun test tests/integration/kafka-broker.integration.test.ts
```

## S3 Storage Notes

### No Changes Required

If you're already using `S3_*` environment variables, no changes needed:
- `S3_ENDPOINT`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `S3_REGION`

### If Using Old Garage Variables

**Old:**
```bash
GARAGE_ENDPOINT=http://garage:3900
GARAGE_ACCESS_KEY_ID=xxx
GARAGE_SECRET_ACCESS_KEY=yyy
```

**New:**
```bash
S3_ENDPOINT=http://garage:3900
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=yyy
```

The S3 client works with any S3-compatible storage:
- AWS S3
- Cloudflare R2
- MinIO
- Garage
- Ceph
- DigitalOcean Spaces
- And more...

## Compatibility Matrix

### Kafka Broker Client

Works with:
- ✅ Apache Kafka
- ✅ Redpanda
- ✅ Confluent Platform
- ✅ Amazon MSK (Managed Streaming for Kafka)
- ✅ Azure Event Hubs (Kafka mode)
- ✅ Aiven for Apache Kafka
- ✅ Any Kafka-compatible broker

### Kafka Connect Client

Works with:
- ✅ Apache Kafka Connect
- ✅ Redpanda Connect
- ✅ Confluent Connect

### S3 Client

Works with:
- ✅ AWS S3
- ✅ Cloudflare R2
- ✅ MinIO
- ✅ Garage
- ✅ Ceph Object Gateway
- ✅ DigitalOcean Spaces
- ✅ Wasabi
- ✅ Backblaze B2 (S3-compatible API)
- ✅ Any S3-compatible storage

## Rollback Plan

If you need to rollback temporarily:

1. Keep both old and new environment variables during transition:
```bash
# Support both naming conventions temporarily
KAFKA_BROKERS=${KAFKA_BROKERS:-${REDPANDA_BROKERS}}
KAFKA_USERNAME=${KAFKA_USERNAME:-${REDPANDA_USERNAME}}
```

2. Use an older git commit:
```bash
git checkout <previous-commit-hash>
```

3. Redeploy with old configuration

## Breaking Changes Summary

**Code:**
- All `IRedpanda*` interfaces renamed to `IKafka*`
- All `createRedpanda*` factory methods renamed to `createKafka*`
- `IFlinkClient` removed

**Environment Variables:**
- All `REDPANDA_*` renamed to `KAFKA_*`
- All `FLINK_*` removed
- All `GARAGE_*` removed (use `S3_*`)

**Documentation:**
- `REDPANDA_*.md` files renamed to `KAFKA_*.md`
- All references updated

## Support

For issues during migration:

1. Check environment variables are correctly named
2. Verify GitHub Secrets are updated
3. Ensure Kubernetes secrets are updated
4. Review code imports for old interface names
5. Check documentation references

## Benefits After Migration

✅ **Vendor Independence** - Not tied to specific products  
✅ **Easier Hiring** - Kafka is more widely known than Redpanda  
✅ **Better Documentation** - Industry-standard terminology  
✅ **Broader Compatibility** - Works with many implementations  
✅ **Simpler Architecture** - Removed unused components (Flink)  
✅ **Clearer Purpose** - S3-compatible clearly indicates what it is  

## Timeline

**Immediate:**
- Update environment variables
- Update code imports
- Run tests

**Within 1 Week:**
- Update all deployments
- Verify monitoring/logging
- Update documentation

**Within 1 Month:**
- Remove old environment variables
- Archive old documentation
- Complete migration

## Questions?

- Review `KAFKA_INTEGRATION_GUIDE.md` for Kafka setup
- Review `S3_STORAGE_GUIDE.md` for S3 storage
- Check GitHub issues for migration problems
- Contact team for support
