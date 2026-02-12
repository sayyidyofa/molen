/**
 * Database Schema for Authentication
 * SQL migration script for PostgreSQL
 */

export const createAuthSchema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(21) PRIMARY KEY, -- nanoid (21 chars)
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT, -- NULL for OAuth2-only users
  full_name VARCHAR(255) NOT NULL,
  oauth_provider VARCHAR(50), -- 'google', 'github', 'keycloak', etc.
  oauth_subject VARCHAR(255), -- External user ID from provider
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Indexes
  CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_subject)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_subject) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with support for email/password and OAuth2 authentication';
COMMENT ON COLUMN users.id IS 'Unique user identifier (nanoid)';
COMMENT ON COLUMN users.email IS 'User email address (unique, case-insensitive)';
COMMENT ON COLUMN users.password_hash IS 'Argon2id password hash (NULL for OAuth2-only users)';
COMMENT ON COLUMN users.oauth_provider IS 'OAuth2 provider name (google, github, keycloak, etc.)';
COMMENT ON COLUMN users.oauth_subject IS 'User ID from OAuth2 provider (sub claim)';
COMMENT ON COLUMN users.is_active IS 'Soft delete flag (false = deleted)';
`;

export const dropAuthSchema = `
-- Drop authentication schema
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP INDEX IF EXISTS idx_users_last_login;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_oauth;
DROP INDEX IF EXISTS idx_users_email;
DROP TABLE IF EXISTS users;
`;

/**
 * Initialize database schema
 */
import type { Sql } from 'postgres';

export async function initializeAuthSchema(sql: Sql): Promise<void> {
  await sql.unsafe(createAuthSchema);
  console.log('✅ Authentication schema initialized');
}

/**
 * Drop database schema (for testing or cleanup)
 */
export async function dropAuthSchemaIfExists(sql: Sql): Promise<void> {
  await sql.unsafe(dropAuthSchema);
  console.log('✅ Authentication schema dropped');
}
