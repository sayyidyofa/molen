import { IRedisClient } from './redis.interface';

/**
 * Mock Redis client for testing without external dependencies
 */
export class MockRedisClient implements IRedisClient {
  private store: Map<string, { value: string; expiry?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Check if expired
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    const entry: { value: string; expiry?: number } = { value };
    if (expirySeconds) {
      entry.expiry = Date.now() + expirySeconds * 1000;
    }
    this.store.set(key, entry);
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newValue = (parseInt(current || '0', 10) + 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue, 10);
  }

  async close(): Promise<void> {
    // No-op for mock
  }

  // Helper method for testing
  clearStore(): void {
    this.store.clear();
  }
}
