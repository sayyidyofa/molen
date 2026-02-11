/**
 * PostgreSQL User Repository Implementation
 */

import postgres from 'postgres';
import { nanoid } from 'nanoid';
import { hashPassword } from './password';
import type { 
  IUserRepository, 
  User, 
  CreateUserPayload, 
  UpdateUserPayload, 
  OAuth2LoginData 
} from './user.types';

/**
 * PostgreSQL-based user repository
 */
export class PostgresUserRepository implements IUserRepository {
  private sql: postgres.Sql;

  constructor(connectionString: string) {
    this.sql = postgres(connectionString);
  }

  async create(payload: CreateUserPayload): Promise<User> {
    const id = nanoid();
    const now = new Date();
    
    let passwordHash: string | null = null;
    if (payload.password) {
      passwordHash = await hashPassword(payload.password);
    }

    const [user] = await this.sql<User[]>`
      INSERT INTO users (
        id, email, password_hash, full_name, 
        oauth_provider, oauth_subject,
        created_at, updated_at, is_active
      )
      VALUES (
        ${id}, ${payload.email}, ${passwordHash}, ${payload.full_name},
        ${payload.oauth_provider || null}, ${payload.oauth_subject || null},
        ${now}, ${now}, true
      )
      RETURNING *
    `;

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.sql<User[]>`
      SELECT * FROM users WHERE id = ${id} AND is_active = true
    `;
    
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.sql<User[]>`
      SELECT * FROM users WHERE email = ${email} AND is_active = true
    `;
    
    return user || null;
  }

  async findByOAuth(provider: string, subject: string): Promise<User | null> {
    const [user] = await this.sql<User[]>`
      SELECT * FROM users 
      WHERE oauth_provider = ${provider} 
        AND oauth_subject = ${subject} 
        AND is_active = true
    `;
    
    return user || null;
  }

  async update(id: string, payload: UpdateUserPayload): Promise<User | null> {
    const now = new Date();
    const updates: Record<string, unknown> = {
      updated_at: now,
    };

    if (payload.full_name !== undefined) {
      updates.full_name = payload.full_name;
    }

    if (payload.password !== undefined) {
      updates.password_hash = await hashPassword(payload.password);
    }

    if (payload.is_active !== undefined) {
      updates.is_active = payload.is_active;
    }

    const setClause = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];

    const [user] = await this.sql<User[]>`
      UPDATE users 
      SET ${this.sql(updates)}
      WHERE id = ${id}
      RETURNING *
    `;

    return user || null;
  }

  async upsertFromOAuth(data: OAuth2LoginData): Promise<User> {
    const now = new Date();
    
    // Try to find existing user by OAuth provider
    const existingUser = await this.findByOAuth(data.provider, data.subject);
    
    if (existingUser) {
      // Update existing user's information
      const [user] = await this.sql<User[]>`
        UPDATE users
        SET 
          email = ${data.email},
          full_name = ${data.full_name},
          updated_at = ${now},
          last_login_at = ${now}
        WHERE oauth_provider = ${data.provider} 
          AND oauth_subject = ${data.subject}
        RETURNING *
      `;
      return user;
    }
    
    // Check if email exists (user might have registered with email/password)
    const existingEmailUser = await this.findByEmail(data.email);
    
    if (existingEmailUser && !existingEmailUser.oauth_provider) {
      // Link OAuth account to existing email/password account
      const [user] = await this.sql<User[]>`
        UPDATE users
        SET 
          oauth_provider = ${data.provider},
          oauth_subject = ${data.subject},
          full_name = ${data.full_name},
          updated_at = ${now},
          last_login_at = ${now}
        WHERE email = ${data.email}
        RETURNING *
      `;
      return user;
    }
    
    // Create new user
    const id = nanoid();
    const [user] = await this.sql<User[]>`
      INSERT INTO users (
        id, email, password_hash, full_name,
        oauth_provider, oauth_subject,
        created_at, updated_at, last_login_at, is_active
      )
      VALUES (
        ${id}, ${data.email}, NULL, ${data.full_name},
        ${data.provider}, ${data.subject},
        ${now}, ${now}, ${now}, true
      )
      RETURNING *
    `;

    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    const now = new Date();
    await this.sql`
      UPDATE users 
      SET last_login_at = ${now}
      WHERE id = ${id}
    `;
  }

  async delete(id: string): Promise<boolean> {
    const [user] = await this.sql<User[]>`
      UPDATE users 
      SET is_active = false
      WHERE id = ${id}
      RETURNING *
    `;
    
    return !!user;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.sql.end();
  }
}
