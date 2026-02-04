import { describe, test, expect, beforeEach } from 'bun:test';
import { MockRedisClient } from '../src/clients/redis.mock';

describe('MockRedisClient', () => {
  let client: MockRedisClient;

  beforeEach(() => {
    client = new MockRedisClient();
  });

  test('should set and get values', async () => {
    await client.set('test-key', 'test-value');
    const value = await client.get('test-key');
    expect(value).toBe('test-value');
  });

  test('should increment counters', async () => {
    const count1 = await client.incr('counter');
    const count2 = await client.incr('counter');
    const count3 = await client.incr('counter');

    expect(count1).toBe(1);
    expect(count2).toBe(2);
    expect(count3).toBe(3);
  });

  test('should handle expiry', async () => {
    await client.set('expiring-key', 'value', 1);
    
    // Should exist immediately
    let value = await client.get('expiring-key');
    expect(value).toBe('value');

    // Wait for expiry
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    value = await client.get('expiring-key');
    expect(value).toBeNull();
  });
});
