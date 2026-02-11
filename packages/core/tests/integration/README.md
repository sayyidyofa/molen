# Integration Tests


## Overview

The integration tests verify actual connectivity and operations with real external services. They are designed to:
- Only run when appropriate credentials are provided via environment variables
- Be minimal in their operations (especially for Redis free tier)
- Skip gracefully when credentials are not available

## Running Integration Tests

### Locally

Set the required environment variables and run:

```bash
cd packages/core

# Set credentials (or use .env file)
export ELASTIC_URL="https://elastic.bongko.id/"
export ELASTIC_USERNAME="sayyidyofa"
export ELASTIC_PASSWORD="your-password"


export REDIS_URL="redis://default:password@host:port"

export S3_ENDPOINT="https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com"
export S3_ACCESS_KEY_ID="your-access-key"
export S3_SECRET_ACCESS_KEY="your-secret-key"
export S3_BUCKET="ml-models"

export KAFKA_BROKERS="broker1:9092,broker2:9092"
export KAFKA_USERNAME="your-username"
export KAFKA_PASSWORD="your-password"
export KAFKA_SASL_MECHANISM="scram-sha-256"

# Run integration tests
bun test tests/integration
```

### Via GitHub Actions

Integration tests run automatically via GitHub Actions workflow when:
- Manually triggered via workflow_dispatch
- Changes are pushed to relevant files
- Pull requests affect client code

Credentials are stored as GitHub repository secrets:
- `ELASTIC_URL`, `ELASTIC_USERNAME`, `ELASTIC_PASSWORD`
- `REDIS_URL`
- `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`
- `KAFKA_BROKERS`, `KAFKA_USERNAME`, `KAFKA_PASSWORD`, `KAFKA_SASL_MECHANISM`

## Test Coverage

### Kafka Broker (kafka-broker.integration.test.ts)
- Connection with SASL authentication (SCRAM-SHA-256/512)
- Topic creation and deletion
- Topic metadata retrieval
- Message production (single and batch)
- Message consumption with consumer groups
- Topic listing
- **Note**: Tests clean up after themselves by deleting test topics

### Elasticsearch (elastic.integration.test.ts)
- Connection with basic authentication
- Document indexing and searching
- Cluster information retrieval

- Connection with Cloudflare Access headers
- Job listing via REST API
- Job status retrieval (if jobs exist)

### Redis (redis.integration.test.ts)
- Connection via connection string
- Basic operations: get, set with expiry
- Counter increment
- Non-existent key handling
- **Note**: Tests are minimal to avoid stressing free tier

### S3 Storage (s3.integration.test.ts)
- Connection to Cloudflare R2 or S3-compatible storage
- Model upload with metadata
- Model download and verification
- Model listing with prefix filtering
- Model existence checking
- Model deletion
- **Note**: Tests clean up after themselves

## Credentials Format

### Kafka Broker (Kafka API)
- Brokers: Comma-separated list `broker1:9092,broker2:9092`
- Auth: SASL with SCRAM-SHA-256 or SCRAM-SHA-512
- SSL: Required (enabled by default)
- Example: 
  ```
  KAFKA_BROKERS=your-kafka-broker:9092
  KAFKA_USERNAME=bongko
  KAFKA_PASSWORD=your-password
  KAFKA_SASL_MECHANISM=scram-sha-256
  ```

### Elasticsearch
- URL: `https://elastic.bongko.id/`
- Auth: Basic authentication with username/password

- Auth: Cloudflare Access headers
  - `CF-Access-Client-Id`
  - `CF-Access-Client-Secret`

### Redis
- Connection string format: `redis://[username]:[password]@[host]:[port]`
- Example: `redis://default:password@redis-12394.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12394`

### S3 Storage (Cloudflare R2)
- Endpoint: `https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com`
- Access Key ID: S3-compatible access key
- Secret Access Key: S3-compatible secret key
- Bucket: `ml-models` (or your bucket name)
- Region: `auto` (for Cloudflare R2)

## Security Notes

- **Never commit credentials to the repository**
- Use environment variables or GitHub secrets
- Credentials are stored in `.env` (gitignored)
- Tests skip gracefully when credentials are not provided
- Integration tests can be run independently from unit tests
