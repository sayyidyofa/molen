import { IS3Client, UploadModelResponse } from './s3.interface';

/**
 * Mock S3 client for testing
 * Stores models in memory
 */
export class MockS3Client implements IS3Client {
  private storage: Map<string, { data: Buffer; metadata?: Record<string, string> }> = new Map();

  async uploadModel(
    key: string,
    data: Buffer | string,
    metadata?: Record<string, string>
  ): Promise<UploadModelResponse> {
    const buffer = typeof data === 'string' ? Buffer.from(data) : data;
    this.storage.set(key, { data: buffer, metadata });
    return {
      ETag: `"mock-etag-${Date.now()}"`,
      Key: key,
    };
  }

  async downloadModel(key: string): Promise<Buffer> {
    const item = this.storage.get(key);
    if (!item) {
      throw new Error(`Model not found: ${key}`);
    }
    return item.data;
  }

  async listModels(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.storage.keys());
    if (prefix) {
      return keys.filter((key) => key.startsWith(prefix));
    }
    return keys;
  }

  async deleteModel(key: string): Promise<void> {
    if (!this.storage.has(key)) {
      throw new Error(`Model not found: ${key}`);
    }
    this.storage.delete(key);
  }

  async modelExists(key: string): Promise<boolean> {
    return this.storage.has(key);
  }

  async close(): Promise<void> {
    // No cleanup needed for mock
  }

  /**
   * Clear all mock data (useful for testing)
   */
  clearMockData(): void {
    this.storage.clear();
  }
}
