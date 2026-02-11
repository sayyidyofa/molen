/**
 * Session Management Interfaces
 * Provides secure session storage with Redis backend
 */

/**
 * Session data stored in Redis
 */
export interface SessionData {
  userId: string;
  email: string;
  fullName: string;
  createdAt: number; // Unix timestamp
  lastAccessedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Session store interface
 */
export interface ISessionStore {
  /**
   * Create a new session
   * @param userId - User ID
   * @param data - Session data
   * @param ttlSeconds - Time to live in seconds
   * @returns Session ID
   */
  create(userId: string, data: Omit<SessionData, 'userId' | 'createdAt' | 'lastAccessedAt' | 'expiresAt'>, ttlSeconds?: number): Promise<string>;
  
  /**
   * Get session data by session ID
   * @param sessionId - Session ID
   * @returns Session data or null if not found/expired
   */
  get(sessionId: string): Promise<SessionData | null>;
  
  /**
   * Update session last accessed time
   * @param sessionId - Session ID
   * @returns True if updated, false if not found
   */
  touch(sessionId: string): Promise<boolean>;
  
  /**
   * Destroy a session
   * @param sessionId - Session ID
   * @returns True if destroyed, false if not found
   */
  destroy(sessionId: string): Promise<boolean>;
  
  /**
   * Destroy all sessions for a user
   * @param userId - User ID
   * @returns Number of sessions destroyed
   */
  destroyUserSessions(userId: string): Promise<number>;
  
  /**
   * Get all sessions for a user
   * @param userId - User ID
   * @returns Array of session IDs
   */
  getUserSessions(userId: string): Promise<string[]>;
  
  /**
   * Extend session TTL
   * @param sessionId - Session ID
   * @param ttlSeconds - New TTL in seconds
   * @returns True if extended, false if not found
   */
  extend(sessionId: string, ttlSeconds: number): Promise<boolean>;
  
  /**
   * Close connection
   */
  close(): Promise<void>;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  /**
   * Default session TTL in seconds (default: 24 hours)
   */
  ttl?: number;
  
  /**
   * Redis connection URL
   */
  redisUrl: string;
  
  /**
   * Session ID prefix for Redis keys
   */
  prefix?: string;
  
  /**
   * Enable session renewal on access
   */
  renewOnAccess?: boolean;
}
