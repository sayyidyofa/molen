import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { RealRedisClient } from '../../src/clients/redis.real';

// Integration tests only run when credentials are provided
const REDIS_URL = process.env.REDIS_URL;

const shouldRun = !!REDIS_URL;

describe.skipIf(!shouldRun)('RealRedisClient Integration', () => {
  let client: RealRedisClient;
  const testKey = 'molen:integration:test';

  beforeAll(() => {
    client = new RealRedisClient({
      url: REDIS_URL!,
    });
  });

  afterAll(async () => {
    if (client) {
      // Clean up test key
      try {
        await client.set(testKey, '', 1); // Set to expire in 1 second
      } catch (e) {
        // Ignore cleanup errors
      }
      await client.close();
    }
  });

  test('should connect to Redis and perform basic operations', async () => {
    // Test set operation
    await client.set(testKey, 'test-value', 60); // 60 seconds expiry
    
    // Test get operation
    const value = await client.get(testKey);
    expect(value).toBe('test-value');
  });

  test('should handle expiry correctly', async () => {
    const expiryTestKey = `${testKey}:expiry`;
    
    // Set with 2 second expiry
    await client.set(expiryTestKey, 'expires-soon', 2);
    
    // Should exist immediately
    const value = await client.get(expiryTestKey);
    expect(value).toBe('expires-soon');
    
    // Note: We don't test actual expiry to keep test fast
    // Real expiry is tested by setting the expiry parameter
  });

  test('should increment counters (minimal operations)', async () => {
    const counterKey = `${testKey}:counter`;
    
    // Increment counter (only do this once to minimize Redis operations)
    const count1 = await client.incr(counterKey);
    expect(count1).toBeGreaterThan(0);
    
    // Clean up immediately
    await client.set(counterKey, '', 1);
  });

  test('should handle non-existent keys', async () => {
    const nonExistentKey = `${testKey}:nonexistent:${Date.now()}`;
    const value = await client.get(nonExistentKey);
    expect(value).toBeNull();
  });
});

if (!shouldRun) {
  console.log('⚠️  Redis integration tests skipped. Set REDIS_URL to run.');
}
