/**
 * Redis Session Store Implementation
 * Provides secure, scalable session management using Redis
 */

import Redis from 'ioredis';
import { nanoid } from 'nanoid';
import type { ISessionStore, SessionData, SessionConfig } from './session.interface';

/**
 * Default session TTL: 24 hours
 */
const DEFAULT_SESSION_TTL = 86400;

/**
 * Session ID length: 32 characters (256 bits of entropy)
 */
const SESSION_ID_LENGTH = 32;

/**
 * Redis-based session store implementation
 */
export class RedisSessionStore implements ISessionStore {
  private redis: Redis;
  private prefix: string;
  private defaultTTL: number;
  private renewOnAccess: boolean;

  constructor(config: SessionConfig) {
    this.redis = new Redis(config.redisUrl);
    this.prefix = config.prefix || 'session:';
    this.defaultTTL = config.ttl || DEFAULT_SESSION_TTL;
    this.renewOnAccess = config.renewOnAccess ?? true;
  }

  /**
   * Generate a secure session ID
   */
  private generateSessionId(): string {
    return nanoid(SESSION_ID_LENGTH);
  }

  /**
   * Build Redis key for session
   */
  private getKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  /**
   * Build Redis key for user sessions index
   */
  private getUserKey(userId: string): string {
    return `${this.prefix}user:${userId}`;
  }

  async create(
    userId: string,
    data: Omit<SessionData, 'userId' | 'createdAt' | 'lastAccessedAt' | 'expiresAt'>,
    ttlSeconds?: number
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = Date.now();
    const ttl = ttlSeconds || this.defaultTTL;
    
    const sessionData: SessionData = {
      userId,
      ...data,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + (ttl * 1000),
    };
    
    const key = this.getKey(sessionId);
    const userKey = this.getUserKey(userId);
    
    // Store session data
    await this.redis.setex(key, ttl, JSON.stringify(sessionData));
    
    // Add session to user's session set
    await this.redis.sadd(userKey, sessionId);
    await this.redis.expire(userKey, ttl);
    
    return sessionId;
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const key = this.getKey(sessionId);
    const data = await this.redis.get(key);
    
    if (!data) {
      return null;
    }
    
    try {
      const sessionData: SessionData = JSON.parse(data);
      
      // Check if session has expired
      if (sessionData.expiresAt < Date.now()) {
        await this.destroy(sessionId);
        return null;
      }
      
      // Renew session on access if enabled
      if (this.renewOnAccess) {
        await this.touch(sessionId);
      }
      
      return sessionData;
    } catch (error) {
      // Invalid JSON, destroy session
      await this.destroy(sessionId);
      return null;
    }
  }

  async touch(sessionId: string): Promise<boolean> {
    const key = this.getKey(sessionId);
    const data = await this.redis.get(key);
    
    if (!data) {
      return false;
    }
    
    try {
      const sessionData: SessionData = JSON.parse(data);
      sessionData.lastAccessedAt = Date.now();
      
      const ttl = await this.redis.ttl(key);
      if (ttl > 0) {
        await this.redis.setex(key, ttl, JSON.stringify(sessionData));
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async destroy(sessionId: string): Promise<boolean> {
    const key = this.getKey(sessionId);
    const data = await this.redis.get(key);
    
    if (!data) {
      return false;
    }
    
    try {
      const sessionData: SessionData = JSON.parse(data);
      const userKey = this.getUserKey(sessionData.userId);
      
      // Remove from user's session set
      await this.redis.srem(userKey, sessionId);
      
      // Delete session
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      // Still try to delete the key
      const result = await this.redis.del(key);
      return result > 0;
    }
  }

  async destroyUserSessions(userId: string): Promise<number> {
    const userKey = this.getUserKey(userId);
    const sessionIds = await this.redis.smembers(userKey);
    
    if (sessionIds.length === 0) {
      return 0;
    }
    
    const keys = sessionIds.map((id) => this.getKey(id));
    const result = await this.redis.del(...keys);
    
    // Clean up user sessions set
    await this.redis.del(userKey);
    
    return result;
  }

  async getUserSessions(userId: string): Promise<string[]> {
    const userKey = this.getUserKey(userId);
    return this.redis.smembers(userKey);
  }

  async extend(sessionId: string, ttlSeconds: number): Promise<boolean> {
    const key = this.getKey(sessionId);
    const data = await this.redis.get(key);
    
    if (!data) {
      return false;
    }
    
    try {
      const sessionData: SessionData = JSON.parse(data);
      sessionData.expiresAt = Date.now() + (ttlSeconds * 1000);
      
      await this.redis.setex(key, ttlSeconds, JSON.stringify(sessionData));
      
      // Also extend user's session set
      const userKey = this.getUserKey(sessionData.userId);
      await this.redis.expire(userKey, ttlSeconds);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}
