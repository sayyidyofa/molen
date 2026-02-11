# S3 Storage for ML Models

This document describes the S3-compatible storage client implementation for storing ML models in the Molen fraud detection system.

## Overview

The S3 storage client provides a unified interface for storing and retrieving ML models. It supports:
- **Cloudflare R2** (S3-compatible storage)
- **Amazon S3**
- Any other S3-compatible storage service

## Architecture

The implementation follows the Interface Factory Pattern used throughout the Molen system:

```
IS3Client (interface)
├── MockS3Client (for testing)
└── RealS3Client (production implementation)
```

### Factory Creation

```typescript
import { ExternalClientFactory } from '@molen/core';

// Creates real or mock client based on USE_MOCKS environment variable
const s3Client = ExternalClientFactory.createS3Client();
```

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
# S3-Compatible Storage (Cloudflare R2 or AWS S3)
S3_ENDPOINT=https://08ebc404f616b60b048d5dbbe34af11a.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=e6cf9886c1fb510ce1f5afd212cd7c07
S3_SECRET_ACCESS_KEY=6676138c59c177b6fee430140e01e2fa01a2262c53780d38777aa206fa78b838
S3_BUCKET=ml-models
S3_REGION=auto

# Testing - Set to true to use mock implementation
USE_MOCKS=false
```

### GitHub Secrets

For CI/CD, add these secrets to your GitHub repository:

1. Go to: **Repository Settings → Secrets and variables → Actions**
2. Add the following secrets:
   - `S3_ENDPOINT`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_BUCKET`

## Usage

### Basic Operations

#### Upload a Model

```typescript
import { ExternalClientFactory } from '@molen/core';

const s3Client = ExternalClientFactory.createS3Client();

// Upload a model file
const modelData = Buffer.from('... model binary data ...');
const metadata = {
  version: '1.0',
  algorithm: 'random-forest',
  accuracy: '0.95',
  trainedAt: new Date().toISOString(),
};

await s3Client.uploadModel(
  'models/fraud-detector-v1.pkl',
  modelData,
  metadata
);
```

#### Download a Model

```typescript
// Download a model
const modelData = await s3Client.downloadModel('models/fraud-detector-v1.pkl');

// Use the model data for inference
// ...
```

#### List Models

```typescript
// List all models
const allModels = await s3Client.listModels();

// List models with prefix
const productionModels = await s3Client.listModels('models/production/');

console.log('Available models:', productionModels);
```

#### Check Model Existence

```typescript
const exists = await s3Client.modelExists('models/fraud-detector-v1.pkl');

if (exists) {
  console.log('Model is available');
} else {
  console.log('Model needs to be trained');
}
```

#### Delete a Model

```typescript
await s3Client.deleteModel('models/old-model-v0.pkl');
```



```typescript
import { ExternalClientFactory } from '@molen/core';

// Initialize clients
const s3Client = ExternalClientFactory.createS3Client();

// Example: Training workflow
async function trainModel() {
    type: 'model-training',
    dataSource: 'fraud-transactions',
    algorithm: 'random-forest',
  });

  // 2. Wait for training to complete
  let status;
  do {
    await new Promise(resolve => setTimeout(resolve, 5000));
  } while (status.state === 'RUNNING');

  // 3. Download trained model and store in S3
  const modelData = Buffer.from('... trained model data ...');
  await s3Client.uploadModel(
    `models/fraud-detector-${Date.now()}.pkl`,
    modelData,
    {
      jobId,
      trainedAt: new Date().toISOString(),
      accuracy: '0.95',
    }
  );
}

// Example: Inference workflow
async function loadModelForInference() {
  // 1. List available models
  const models = await s3Client.listModels('models/production/');
  
  // 2. Download latest model
  const latestModel = models[models.length - 1];
  const modelData = await s3Client.downloadModel(latestModel);
  
    type: 'model-inference',
    model: modelData.toString('base64'),
    dataSource: 'live-transactions',
  });
}
```

## Mock Implementation

For testing and development, use the mock implementation:

```typescript
import { MockS3Client } from '@molen/core';

const mockClient = new MockS3Client();

// Upload test data
await mockClient.uploadModel('test-model.pkl', 'test data');

// Test your code
const data = await mockClient.downloadModel('test-model.pkl');

// Clear mock data between tests
mockClient.clearMockData();
```

## Model Organization

Recommended bucket structure:

```
ml-models/
├── models/
│   ├── production/
│   │   ├── fraud-detector-v1.0.pkl
│   │   └── fraud-detector-v1.1.pkl
│   ├── staging/
│   │   └── fraud-detector-v2.0-beta.pkl
│   └── experimental/
│       └── new-algorithm-test.pkl
├── training-data/
│   ├── 2024-01/
│   └── 2024-02/
└── metadata/
    └── model-registry.json
```

## Best Practices

### 1. Model Versioning

Include version information in model keys and metadata:

```typescript
await s3Client.uploadModel(
  `models/production/fraud-detector-v${version}.pkl`,
  modelData,
  {
    version,
    algorithm: 'random-forest',
    features: '42',
    accuracy: '0.95',
    f1Score: '0.93',
    trainedAt: new Date().toISOString(),
  }
);
```

### 2. Model Lifecycle

```typescript
// Archive old models instead of deleting
async function archiveModel(modelKey: string) {
  const data = await s3Client.downloadModel(modelKey);
  const archiveKey = modelKey.replace('production/', 'archive/');
  await s3Client.uploadModel(archiveKey, data);
  await s3Client.deleteModel(modelKey);
}
```

### 3. Error Handling

```typescript
try {
  const model = await s3Client.downloadModel('models/critical-model.pkl');
  // Use model
} catch (error) {
  console.error('Failed to load model:', error);
  // Fallback to previous version or default behavior
  const fallbackModel = await s3Client.downloadModel('models/fallback.pkl');
}
```

### 4. Cleanup

Always close the client when done:

```typescript
try {
  // Use S3 client
  await s3Client.uploadModel('model.pkl', data);
} finally {
  await s3Client.close();
}
```

## Testing

### Unit Tests

Run mock client tests:

```bash
cd packages/core
bun test tests/s3.mock.test.ts
```

### Integration Tests

Run tests against real S3/R2:

```bash
# Set credentials
export S3_ENDPOINT="https://..."
export S3_ACCESS_KEY_ID="..."
export S3_SECRET_ACCESS_KEY="..."
export S3_BUCKET="ml-models"

# Run tests
cd packages/core
bun test tests/integration/s3.integration.test.ts
```

## Cloudflare R2 Specific Notes

### Authentication

Cloudflare R2 uses S3-compatible authentication:
- **Access Key ID**: Acts as the username
- **Secret Access Key**: Acts as the password
- **Endpoint**: Unique per R2 bucket

### Region

R2 uses `region: 'auto'` instead of specific AWS regions.

### Features

R2 supports:
- ✅ Standard S3 API operations
- ✅ Multipart uploads (for large models)
- ✅ Custom metadata
- ✅ Bucket listing
- ❌ S3 Select (not supported)
- ❌ Requester Pays (not supported)

### Pricing

Cloudflare R2 advantages:
- No egress fees (free data transfer out)
- Free operations up to limits
- Cost-effective for ML model storage

## Security

### Credentials Management

- ✅ **Never commit credentials** to the repository
- ✅ Use environment variables or GitHub Secrets
- ✅ Rotate credentials periodically
- ✅ Use least-privilege access policies

### Access Control

Configure bucket policies to restrict access:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
      "s3:DeleteObject"
    ],
    "Resource": [
      "arn:aws:s3:::ml-models/*",
      "arn:aws:s3:::ml-models"
    ]
  }]
}
```

## Troubleshooting

### Connection Issues

```typescript
// Test connection
try {
  const exists = await s3Client.modelExists('test.txt');
  console.log('S3 connection successful');
} catch (error) {
  console.error('S3 connection failed:', error);
}
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `NoSuchKey` | Model doesn't exist | Check model key and bucket |
| `InvalidAccessKeyId` | Wrong credentials | Verify access key ID |
| `SignatureDoesNotMatch` | Wrong secret key | Verify secret access key |
| `NoSuchBucket` | Bucket doesn't exist | Create bucket or fix name |
| `AccessDenied` | Insufficient permissions | Update IAM/bucket policies |

## Performance Optimization

### Large Models

For models > 5MB, consider:

```typescript
// Use streams for large files
// (Future enhancement)
```

### Caching

Cache frequently used models:

```typescript
const modelCache = new Map<string, Buffer>();

async function getCachedModel(key: string): Promise<Buffer> {
  if (!modelCache.has(key)) {
    const data = await s3Client.downloadModel(key);
    modelCache.set(key, data);
  }
  return modelCache.get(key)!;
}
```

## References

- [AWS SDK for JavaScript v3 - S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [S3 API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/)
