/**
 * Redis client interface for velocity state management
 */
export interface IRedisClient {
  /**
   * Get a value from Redis
   * @param key - The key to retrieve
   * @returns Promise with the value or null
   */
  get(key: string): Promise<string | null>;

  /**
   * Set a value in Redis
   * @param key - The key to set
   * @param value - The value to store
   * @param expirySeconds - Optional expiry time in seconds
   * @returns Promise with operation result
   */
  set(key: string, value: string, expirySeconds?: number): Promise<void>;

  /**
   * Increment a counter in Redis
   * @param key - The key to increment
   * @returns Promise with the new value
   */
  incr(key: string): Promise<number>;

  /**
   * Close the client connection
   */
  close(): Promise<void>;
}
