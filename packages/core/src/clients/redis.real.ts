import { IRedisClient } from './redis.interface';
import Redis from 'ioredis';

/**
 * Real Redis client implementation for velocity state management
 */
export class RealRedisClient implements IRedisClient {
  private client: Redis;

  constructor(config: { host: string; port: number; password?: string } | { url: string }) {
    // Support both connection string and individual config
    if ('url' in config) {
      this.client = new Redis(config.url);
    } else {
      this.client = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
      });
    }

    // Add error handler to prevent "Unhandled error event" crashes
    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    if (expirySeconds) {
      await this.client.setex(key, expirySeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}
