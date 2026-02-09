import { describe, test, expect, beforeEach } from 'bun:test';
import { MockS3Client } from '../src/clients/s3.mock';

describe('MockS3Client', () => {
  let client: MockS3Client;

  beforeEach(() => {
    client = new MockS3Client();
  });

  test('should upload and download a model', async () => {
    const key = 'models/fraud-detector-v1.pkl';
    const data = Buffer.from('mock model data');
    const metadata = { version: '1.0', type: 'fraud-detector' };

    // Upload model
    const uploadResult = await client.uploadModel(key, data, metadata);
    expect(uploadResult.Key).toBe(key);
    expect(uploadResult.ETag).toBeDefined();

    // Download model
    const downloadedData = await client.downloadModel(key);
    expect(downloadedData.toString()).toBe('mock model data');
  });

  test('should list models', async () => {
    // Upload multiple models
    await client.uploadModel('models/detector-v1.pkl', 'data1');
    await client.uploadModel('models/detector-v2.pkl', 'data2');
    await client.uploadModel('training/dataset.csv', 'data3');

    // List all models
    const allModels = await client.listModels();
    expect(allModels.length).toBe(3);

    // List with prefix
    const modelsOnly = await client.listModels('models/');
    expect(modelsOnly.length).toBe(2);
    expect(modelsOnly).toContain('models/detector-v1.pkl');
    expect(modelsOnly).toContain('models/detector-v2.pkl');
  });

  test('should check if model exists', async () => {
    const key = 'models/test-model.pkl';
    
    // Model should not exist initially
    expect(await client.modelExists(key)).toBe(false);

    // Upload model
    await client.uploadModel(key, 'test data');

    // Model should exist now
    expect(await client.modelExists(key)).toBe(true);
  });

  test('should delete a model', async () => {
    const key = 'models/temp-model.pkl';
    
    // Upload model
    await client.uploadModel(key, 'temp data');
    expect(await client.modelExists(key)).toBe(true);

    // Delete model
    await client.deleteModel(key);
    expect(await client.modelExists(key)).toBe(false);
  });

  test('should throw error when downloading non-existent model', async () => {
    expect(async () => {
      await client.downloadModel('non-existent.pkl');
    }).toThrow();
  });

  test('should throw error when deleting non-existent model', async () => {
    expect(async () => {
      await client.deleteModel('non-existent.pkl');
    }).toThrow();
  });

  test('should clear all mock data', async () => {
    await client.uploadModel('model1.pkl', 'data1');
    await client.uploadModel('model2.pkl', 'data2');
    
    expect((await client.listModels()).length).toBe(2);
    
    client.clearMockData();
    
    expect((await client.listModels()).length).toBe(0);
  });

  test('should handle string data upload', async () => {
    const key = 'models/string-model.txt';
    const data = 'string model data';

    await client.uploadModel(key, data);
    const downloaded = await client.downloadModel(key);
    
    expect(downloaded.toString()).toBe(data);
  });
});
