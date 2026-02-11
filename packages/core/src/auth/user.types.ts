/**
 * User Types and Database Models
 */

/**
 * User in database
 */
export interface User {
  id: string; // UUID
  email: string;
  password_hash: string | null; // Nullable for OAuth2-only users
  full_name: string;
  oauth_provider: string | null; // 'google', 'github', 'keycloak', etc.
  oauth_subject: string | null; // External user ID from provider
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
  is_active: boolean;
}

/**
 * User creation payload
 */
export interface CreateUserPayload {
  email: string;
  password?: string; // Optional for OAuth2 users
  full_name: string;
  oauth_provider?: string;
  oauth_subject?: string;
}

/**
 * User update payload
 */
export interface UpdateUserPayload {
  full_name?: string;
  password?: string;
  is_active?: boolean;
}

/**
 * User with safe fields (no password_hash)
 */
export type SafeUser = Omit<User, 'password_hash'>;

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * OAuth2 login data
 */
export interface OAuth2LoginData {
  provider: string;
  subject: string;
  email: string;
  full_name: string;
}

/**
 * User repository interface
 */
export interface IUserRepository {
  /**
   * Create a new user
   */
  create(payload: CreateUserPayload): Promise<User>;
  
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;
  
  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Find user by OAuth2 provider and subject
   */
  findByOAuth(provider: string, subject: string): Promise<User | null>;
  
  /**
   * Update user
   */
  update(id: string, payload: UpdateUserPayload): Promise<User | null>;
  
  /**
   * Upsert user from OAuth2 data (create if doesn't exist, update if exists)
   */
  upsertFromOAuth(data: OAuth2LoginData): Promise<User>;
  
  /**
   * Update last login time
   */
  updateLastLogin(id: string): Promise<void>;
  
  /**
   * Delete user (soft delete by setting is_active = false)
   */
  delete(id: string): Promise<boolean>;
}
