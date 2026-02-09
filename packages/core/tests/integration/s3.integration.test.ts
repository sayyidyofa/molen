import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { RealS3Client } from '../../src/clients/s3.real';

// Integration tests only run when credentials are provided
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_BUCKET = process.env.S3_BUCKET || 'ml-models';

const shouldRun = S3_ENDPOINT && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY;

describe.skipIf(!shouldRun)('RealS3Client Integration', () => {
  let client: RealS3Client;
  const testPrefix = `test/${Date.now()}/`;
  const testKey = `${testPrefix}test-model.pkl`;

  beforeAll(() => {
    client = new RealS3Client({
      endpoint: S3_ENDPOINT!,
      accessKeyId: S3_ACCESS_KEY_ID!,
      secretAccessKey: S3_SECRET_ACCESS_KEY!,
      bucket: S3_BUCKET,
      region: 'auto',
    });
  });

  afterAll(async () => {
    if (client) {
      // Clean up test files
      try {
        const models = await client.listModels(testPrefix);
        for (const key of models) {
          await client.deleteModel(key);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      await client.close();
    }
  });

  test('should connect to S3 and upload a model', async () => {
    const modelData = Buffer.from('Test ML model data');
    const metadata = {
      version: '1.0',
      type: 'test',
      timestamp: new Date().toISOString(),
    };

    // Upload model
    const result = await client.uploadModel(testKey, modelData, metadata);
    expect(result).toBeDefined();
  });

  test('should check if model exists', async () => {
    // Model should exist from previous test
    const exists = await client.modelExists(testKey);
    expect(exists).toBe(true);

    // Non-existent model
    const notExists = await client.modelExists(`${testPrefix}non-existent.pkl`);
    expect(notExists).toBe(false);
  });

  test('should download the uploaded model', async () => {
    const downloadedData = await client.downloadModel(testKey);
    expect(downloadedData.toString()).toBe('Test ML model data');
  });

  test('should list models with prefix', async () => {
    // Upload another model
    await client.uploadModel(`${testPrefix}model2.pkl`, 'Model 2 data');

    // List models
    const models = await client.listModels(testPrefix);
    expect(models.length).toBeGreaterThanOrEqual(2);
    expect(models).toContain(testKey);
    expect(models).toContain(`${testPrefix}model2.pkl`);
  });

  test('should delete a model', async () => {
    const deleteKey = `${testPrefix}delete-test.pkl`;
    
    // Upload model
    await client.uploadModel(deleteKey, 'Delete me');
    expect(await client.modelExists(deleteKey)).toBe(true);

    // Delete model
    await client.deleteModel(deleteKey);
    expect(await client.modelExists(deleteKey)).toBe(false);
  });

  test('should handle empty list', async () => {
    const models = await client.listModels(`${testPrefix}non-existent-prefix/`);
    expect(models).toEqual([]);
  });
});

if (!shouldRun) {
  console.log('⚠️  S3 integration tests skipped. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY to run.');
}
