# Setting Up GitHub Secrets for Integration Tests

This guide explains how to configure GitHub repository secrets for the integration tests.

## Why GitHub Secrets?

GitHub Secrets allow us to:
- Store sensitive credentials securely
- Never commit credentials to the repository
- Use credentials in GitHub Actions workflows
- Control access to production services

## Required Secrets

The following secrets need to be added to your GitHub repository:

### Elasticsearch Credentials

| Secret Name | Value |
|------------|-------|
| `ELASTIC_URL` | `https://elastic.bongko.id/` |
| `ELASTIC_USERNAME` | `sayyidyofa` |
| `ELASTIC_PASSWORD` | `Pi@rgen8` |

**Purpose**: Authenticate to Elasticsearch cluster for testing indexing and search operations.

### Flink Credentials (with Cloudflare Access)

| Secret Name | Value |
|------------|-------|
| `FLINK_URL` | `https://flink.bongko.id` |
| `FLINK_CLIENT_ID` | `9e677b2b60b017835bca23b3267cd224.access` |
| `FLINK_CLIENT_SECRET` | `9f156234b1a72bc0ba68ee25683ff1844b4a5dd1ab29a89f4d647deeefaa5559` |

**Purpose**: Authenticate to Flink REST API through Cloudflare Access for testing job management.

### Redis Credentials

| Secret Name | Value |
|------------|-------|
| `REDIS_URL` | `redis://default:PZMF7X2Qxxtt3Xet21PbLO3dEP13S1Yx@redis-12394.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12394` |

**Purpose**: Connect to Redis Cloud free tier for testing basic operations.

### S3 Storage Credentials (Cloudflare R2)

| Secret Name | Value |
|------------|-------|
| `S3_ENDPOINT` | `https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` | `e6cf9886c1fb510ce1f5afd212cd7c07` |
| `S3_SECRET_ACCESS_KEY` | `6676138c59c177b6fee430140e01e2fa01a2262c53780d38777aa206fa78b838` |
| `S3_BUCKET` | `ml-models` |

**Purpose**: Connect to Cloudflare R2 for testing ML model storage operations.

## How to Add Secrets

### Step-by-Step Instructions

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click on "Settings" tab

2. **Access Secrets Section**
   - In the left sidebar, click "Secrets and variables"
   - Click "Actions"

3. **Add Each Secret**
   - Click "New repository secret"
   - Enter the secret name (e.g., `ELASTIC_URL`)
   - Enter the secret value
   - Click "Add secret"
   - Repeat for all 11 secrets

### Screenshot Guide

```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

## Verifying Setup

After adding all secrets:

1. Go to the "Actions" tab in your repository
2. Find the "Integration Tests" workflow
3. Click "Run workflow" to manually trigger it
4. The workflow should run successfully if all secrets are configured correctly

## Security Best Practices

✅ **Do:**
- Use GitHub Secrets for all sensitive data
- Rotate credentials periodically
- Limit access to repository settings to trusted collaborators
- Review secret usage in workflow logs (secrets are masked)

❌ **Don't:**
- Commit credentials to code
- Share secrets via unsecured channels
- Use production credentials in development
- Store secrets in .env files that might be committed

## Testing Locally

To run integration tests locally without GitHub Actions:

1. Create a `.env` file in the project root (it's gitignored):

```bash
# .env
ELASTIC_URL=https://elastic.bongko.id/
ELASTIC_USERNAME=sayyidyofa
ELASTIC_PASSWORD=Pi@rgen8

FLINK_URL=https://flink.bongko.id
FLINK_CLIENT_ID=9e677b2b60b017835bca23b3267cd224.access
FLINK_CLIENT_SECRET=9f156234b1a72bc0ba68ee25683ff1844b4a5dd1ab29a89f4d647deeefaa5559

REDIS_URL=redis://default:PZMF7X2Qxxtt3Xet21PbLO3dEP13S1Yx@redis-12394.c252.ap-southeast-1-1.ec2.cloud.redislabs.com:12394
```

2. Run tests:

```bash
cd packages/core
source ../../.env  # Load environment variables
bun test tests/integration
```

## Troubleshooting

### Tests Skip with Warning Message

If you see messages like:
```
⚠️  Elasticsearch integration tests skipped. Set ELASTIC_URL, ELASTIC_USERNAME, and ELASTIC_PASSWORD to run.
```

**Solution**: Ensure all required environment variables are set (locally) or secrets are added (GitHub Actions).

### Connection Errors

**Elasticsearch**: Verify URL format includes `https://` and trailing `/`
**Flink**: Ensure URL uses `https://` without trailing `/`
**Redis**: Check connection string format matches `redis://username:password@host:port`

### GitHub Actions Workflow Fails

1. Check workflow logs in the Actions tab
2. Verify all 7 secrets are added correctly
3. Ensure secret names match exactly (case-sensitive)
4. Check if services are accessible from GitHub Actions runners

## Additional Notes

- **Redis Free Tier**: Tests are designed to be minimal to avoid hitting rate limits
- **Cloudflare Access**: Flink requires both Client ID and Secret headers
- **Elasticsearch**: Uses basic authentication
- **Secret Rotation**: If credentials change, update GitHub Secrets accordingly

## Support

For issues with:
- **GitHub Secrets**: Check GitHub documentation on [Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- **Integration Tests**: See `packages/core/tests/integration/README.md`
- **Client Implementations**: Check source files in `packages/core/src/clients/`
