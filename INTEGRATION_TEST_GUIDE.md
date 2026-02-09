# Integration Test Execution Guide

## Quick Start

### Running All Integration Tests

```bash
cd packages/core
bun test tests/integration
```

### Running Specific Test Suites

```bash
# Elasticsearch only
bun test tests/integration/elastic.integration.test.ts

# Flink only
bun test tests/integration/flink.integration.test.ts

# Redis only
bun test tests/integration/redis.integration.test.ts
```

## Prerequisites

### 1. Install Dependencies

```bash
cd packages/core
bun install
```

This will install:
- `@elastic/elasticsearch` - Elasticsearch client
- `ioredis` - Redis client
- Other required dependencies

### 2. Set Up Credentials

Choose one of these methods:

#### Option A: Environment Variables (Quick Test)

```bash
export ELASTIC_URL="https://elastic.bongko.id/"
export ELASTIC_USERNAME="sayyidyofa"
export ELASTIC_PASSWORD="Pi@rgen8"

export FLINK_URL="https://flink.bongko.id"
export FLINK_CLIENT_ID="9e677b2b60b017835bca23b3267cd224.access"
export FLINK_CLIENT_SECRET="9f156234b1a72bc0ba68ee25683ff1844b4a5dd1ab29a89f4d647deeefaa5559"

export REDIS_URL="redis://default:PZMF7X2Qxxtt3Xet21PbLO3dEP13S1Yx@redis-12394.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12394"

# Then run tests
cd packages/core
bun test tests/integration
```

#### Option B: .env File (Persistent)

Create `.env` in project root:

```bash
# .env (this file is gitignored)
ELASTIC_URL=https://elastic.bongko.id/
ELASTIC_USERNAME=sayyidyofa
ELASTIC_PASSWORD=Pi@rgen8

FLINK_URL=https://flink.bongko.id
FLINK_CLIENT_ID=9e677b2b60b017835bca23b3267cd224.access
FLINK_CLIENT_SECRET=9f156234b1a72bc0ba68ee25683ff1844b4a5dd1ab29a89f4d647deeefaa5559

REDIS_URL=redis://default:PZMF7X2Qxxtt3Xet21PbLO3dEP13S1Yx@redis-12394.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12394
```

Then load and run:

```bash
source .env
cd packages/core
bun test tests/integration
```

## Expected Output

### Successful Run (All Credentials Present)

```
$ bun test tests/integration

✓ RealElasticClient Integration > should connect to Elasticsearch and get cluster info
✓ RealElasticClient Integration > should create and search for a test document

✓ RealFlinkClient Integration > should connect to Flink and list jobs
✓ RealFlinkClient Integration > should get job status (if jobs exist)

✓ RealRedisClient Integration > should connect to Redis and perform basic operations
✓ RealRedisClient Integration > should handle expiry correctly
✓ RealRedisClient Integration > should increment counters (minimal operations)
✓ RealRedisClient Integration > should handle non-existent keys

8 tests passed, 0 failed
```

### Partial Run (Some Credentials Missing)

```
$ bun test tests/integration

⚠️  Elasticsearch integration tests skipped. Set ELASTIC_URL, ELASTIC_USERNAME, and ELASTIC_PASSWORD to run.

✓ RealFlinkClient Integration > should connect to Flink and list jobs
✓ RealFlinkClient Integration > should get job status (if jobs exist)

✓ RealRedisClient Integration > should connect to Redis and perform basic operations
✓ RealRedisClient Integration > should handle expiry correctly
✓ RealRedisClient Integration > should increment counters (minimal operations)
✓ RealRedisClient Integration > should handle non-existent keys

6 tests passed, 0 failed, 2 skipped
```

## What Each Test Does

### Elasticsearch Tests

1. **Connection Test**
   - Verifies authentication with username/password
   - Retrieves cluster information
   - Confirms basic connectivity

2. **Indexing and Search Test**
   - Creates a test document in `molen-integration-test` index
   - Waits for document to be searchable
   - Searches for and verifies the document
   - Tests full write-read cycle

### Flink Tests

1. **List Jobs Test**
   - Tests Cloudflare Access header authentication
   - Calls `/jobs` endpoint
   - Verifies API connectivity

2. **Get Job Status Test**
   - Lists available jobs
   - If jobs exist, retrieves status of first job
   - Tests job detail retrieval
   - Gracefully skips if no jobs available

### Redis Tests

1. **Basic Operations Test**
   - Sets a key with expiry
   - Retrieves the key
   - Verifies value matches

2. **Expiry Test**
   - Sets a key with 2-second expiry
   - Verifies immediate availability
   - (Note: doesn't wait for expiry to keep tests fast)

3. **Counter Test**
   - Increments a counter once
   - Verifies increment works
   - Immediately cleans up (minimal operations for free tier)

4. **Non-existent Key Test**
   - Requests a key that doesn't exist
   - Verifies null return

## Troubleshooting

### "Cannot find module '@elastic/elasticsearch'"

```bash
cd packages/core
bun install
```

### "Cannot find module 'ioredis'"

```bash
cd packages/core
bun install
```

### Tests Skip with Warning

Ensure all environment variables are set:

```bash
# Check if variables are set
echo $ELASTIC_URL
echo $FLINK_URL
echo $REDIS_URL

# If empty, set them or source .env file
```

### Connection Timeout/Refused

1. **Check URLs**: Ensure URLs are correct and accessible
2. **Check Credentials**: Verify credentials are valid
3. **Check Network**: Ensure you can reach the services
4. **Check Service Status**: Services might be down

Test connectivity manually:

```bash
# Test Elasticsearch
curl -u "sayyidyofa:Pi@rgen8" "https://elastic.bongko.id/"

# Test Flink
curl -X GET "https://flink.bongko.id/jobs" \
  -H "CF-Access-Client-Id: 9e677b2b60b017835bca23b3267cd224.access" \
  -H "CF-Access-Client-Secret: 9f156234b1a72bc0ba68ee25683ff1844b4a5dd1ab29a89f4d647deeefaa5559"

# Test Redis (requires redis-cli)
redis-cli -u "redis://default:PZMF7X2Qxxtt3Xet21PbLO3dEP13S1Yx@redis-12394.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12394" PING
```

### Redis Rate Limiting

If you see rate limit errors:
- Wait a few minutes before retrying
- Tests are designed to be minimal
- Run tests less frequently
- Consider upgrading Redis tier if needed

## Best Practices

1. **Don't Commit Credentials**
   - Always use environment variables or .env
   - .env is gitignored - never commit it
   - Use GitHub Secrets for CI/CD

2. **Minimize Redis Operations**
   - Tests are already minimal
   - Don't run tests repeatedly in quick succession
   - Free tier has limits

3. **Clean Up**
   - Tests clean up after themselves
   - Test data expires automatically
   - No manual cleanup needed

4. **Run Integration Tests Separately**
   - Use `bun test tests/integration` for integration tests
   - Use `bun test` (without path) for unit tests
   - Keep them separate in CI/CD

## GitHub Actions

Integration tests run automatically in CI/CD when:
- Code is pushed to main branch
- Pull requests are opened
- Manually triggered via workflow_dispatch

See `.github/workflows/integration-tests.yml` for configuration.

Credentials for GitHub Actions are stored as repository secrets (see GITHUB_SECRETS_SETUP.md).
