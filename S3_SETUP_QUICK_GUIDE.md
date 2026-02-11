# S3 Storage Setup for ML Models

## Quick Setup Guide

This guide provides the exact credentials for setting up S3-compatible storage (Cloudflare R2) for ML model storage in the Molen system.

## Cloudflare R2 Credentials

### Configuration Values

Use these exact values for your S3 client configuration:

| Variable | Value |
|----------|-------|
| **S3_ENDPOINT** | `https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com` |
| **S3_ACCESS_KEY_ID** | `e6cf9886c1fb510ce1f5afd212cd7c07` |
| **S3_SECRET_ACCESS_KEY** | `6676138c59c177b6fee430140e01e2fa01a2262c53780d38777aa206fa78b838` |
| **S3_BUCKET** | `ml-models` (recommended) |
| **S3_REGION** | `auto` |

### Cloudflare API Token (Optional)

For advanced R2 management operations:
- **Token**: `qep4T4mPd5wy0AhgTU0i1oMF3OmPbO_P6m0M13vB`

Note: The API token is for Cloudflare API management, not S3 operations.

## Local Setup

### Option 1: Environment Variables

```bash
export S3_ENDPOINT="https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com"
export S3_ACCESS_KEY_ID="e6cf9886c1fb510ce1f5afd212cd7c07"
export S3_SECRET_ACCESS_KEY="6676138c59c177b6fee430140e01e2fa01a2262c53780d38777aa206fa78b838"
export S3_BUCKET="ml-models"
export S3_REGION="auto"
```

### Option 2: .env File

Create/update `.env` in the project root:

```env
# S3-Compatible Storage (Cloudflare R2) for ML Model Storage
S3_ENDPOINT=https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=e6cf9886c1fb510ce1f5afd212cd7c07
S3_SECRET_ACCESS_KEY=6676138c59c177b6fee430140e01e2fa01a2262c53780d38777aa206fa78b838
S3_BUCKET=ml-models
S3_REGION=auto

# For production, set USE_MOCKS to false
USE_MOCKS=false
```

## GitHub Secrets Setup

For CI/CD integration, add these secrets to your GitHub repository:

1. **Navigate to Repository Settings**
   - Go to: Repository → Settings → Secrets and variables → Actions

2. **Add New Repository Secrets**
   Click "New repository secret" for each:

   | Secret Name | Value |
   |------------|-------|
   | `S3_ENDPOINT` | `https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com` |
   | `S3_ACCESS_KEY_ID` | `e6cf9886c1fb510ce1f5afd212cd7c07` |
   | `S3_SECRET_ACCESS_KEY` | `6676138c59c177b6fee430140e01e2fa01a2262c53780d38777aa206fa78b838` |
   | `S3_BUCKET` | `ml-models` |

## Verification

Test the connection:

```bash
cd packages/core

# Run unit tests (uses mock)
bun test tests/s3.mock.test.ts

# Run integration tests (uses real S3)
# Make sure credentials are set first
bun test tests/integration/s3.integration.test.ts
```

## Usage Example

```typescript
import { ExternalClientFactory } from '@molen/core';

// Create S3 client (automatically uses credentials from environment)
const s3Client = ExternalClientFactory.createS3Client();

// Upload a model
const modelData = Buffer.from('your model data here');
await s3Client.uploadModel(
  'models/fraud-detector-v1.pkl',
  modelData,
  {
    version: '1.0',
    accuracy: '0.95',
    trainedAt: new Date().toISOString(),
  }
);

// Download a model
const downloaded = await s3Client.downloadModel('models/fraud-detector-v1.pkl');

// List models
const models = await s3Client.listModels('models/');
console.log('Available models:', models);

// Clean up
await s3Client.close();
```


Example workflow for training and storing models:

```typescript
import { ExternalClientFactory } from '@molen/core';

const s3 = ExternalClientFactory.createS3Client();

  type: 'model-training',
  algorithm: 'random-forest',
  dataSource: 'fraud-transactions',
});

// 2. Wait for training completion
console.log('Training model...');
let status;
do {
  await new Promise(resolve => setTimeout(resolve, 5000));
} while (status.state === 'RUNNING');

// 3. Upload trained model to S3
const modelData = Buffer.from('trained model binary data');
await s3.uploadModel(
  `models/production/fraud-detector-${Date.now()}.pkl`,
  modelData,
  {
    jobId,
    trainedAt: new Date().toISOString(),
    algorithm: 'random-forest',
  }
);

console.log('Model trained and stored successfully!');
```

## Bucket Structure

Recommended organization:

```
ml-models/
├── models/
│   ├── production/          # Production-ready models
│   │   ├── fraud-detector-v1.0.pkl
│   │   └── fraud-detector-v1.1.pkl
│   ├── staging/             # Models in testing
│   └── experimental/        # Research models
├── training-data/           # Training datasets
└── metadata/                # Model registry and metadata
```

## Security Notes

⚠️ **Important Security Practices:**

1. **Never commit credentials** to the repository
2. `.env` file is gitignored - safe for local development
3. Use GitHub Secrets for CI/CD (never in code)
4. Rotate credentials periodically
5. Use least-privilege access policies

## Troubleshooting

### Test Connection Manually

Using curl (note: S3 API requires signed requests, this is just for endpoint check):

```bash
# Check if endpoint is accessible
curl -I https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Credentials not provided" error | Set `S3_ACCESS_KEY_ID` and `S3_SECRET_ACCESS_KEY` |
| "NoSuchBucket" error | Create bucket or verify `S3_BUCKET` name |
| Connection timeout | Check endpoint URL is correct |
| "InvalidAccessKeyId" | Verify access key ID is exact |
| "SignatureDoesNotMatch" | Verify secret access key is exact |

### Debug Mode

Enable debug logging:

```typescript
// Add before using S3 client
process.env.AWS_SDK_LOG_LEVEL = 'debug';
```

## Additional Resources

- **Detailed Guide**: See [S3_STORAGE_GUIDE.md](S3_STORAGE_GUIDE.md) for comprehensive documentation
- **Integration Tests**: See `packages/core/tests/integration/s3.integration.test.ts`
- **Unit Tests**: See `packages/core/tests/s3.mock.test.ts`
- **Interface**: See `packages/core/src/clients/s3.interface.ts`

## Support

For issues or questions:
1. Check the comprehensive [S3_STORAGE_GUIDE.md](S3_STORAGE_GUIDE.md)
2. Review integration test examples
3. Verify credentials are correctly set
4. Check Cloudflare R2 dashboard for bucket status
