# Integration Tests

This directory contains integration tests for external service clients (Elasticsearch, Flink, and Redis).

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

export FLINK_URL="https://flink.bongko.id"
export FLINK_CLIENT_ID="your-client-id"
export FLINK_CLIENT_SECRET="your-client-secret"

export REDIS_URL="redis://default:password@host:port"

# Run integration tests
bun test tests/integration
```

### Via GitHub Actions

Integration tests run automatically via GitHub Actions workflow when:
- Manually triggered via workflow_dispatch
- Changes are pushed to relevant files
- Pull requests affect client code

Credentials are stored as GitHub repository secrets:
- `ELASTIC_URL`
- `ELASTIC_USERNAME`
- `ELASTIC_PASSWORD`
- `FLINK_URL`
- `FLINK_CLIENT_ID`
- `FLINK_CLIENT_SECRET`
- `REDIS_URL`

## Test Coverage

### Elasticsearch (elastic.integration.test.ts)
- Connection with basic authentication
- Document indexing and searching
- Cluster information retrieval

### Flink (flink.integration.test.ts)
- Connection with Cloudflare Access headers
- Job listing via REST API
- Job status retrieval (if jobs exist)

### Redis (redis.integration.test.ts)
- Connection via connection string
- Basic operations: get, set with expiry
- Counter increment
- Non-existent key handling
- **Note**: Tests are minimal to avoid stressing free tier

## Credentials Format

### Elasticsearch
- URL: `https://elastic.bongko.id/`
- Auth: Basic authentication with username/password

### Flink
- URL: `https://flink.bongko.id`
- Auth: Cloudflare Access headers
  - `CF-Access-Client-Id`
  - `CF-Access-Client-Secret`

### Redis
- Connection string format: `redis://[username]:[password]@[host]:[port]`
- Example: `redis://default:password@redis-12394.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12394`

## Security Notes

- **Never commit credentials to the repository**
- Use environment variables or GitHub secrets
- Credentials are stored in `.env` (gitignored)
- Tests skip gracefully when credentials are not provided
- Integration tests can be run independently from unit tests
