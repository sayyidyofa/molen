# Authentication System - Complete Implementation Guide

## Overview

Molen implements a comprehensive, secure authentication system with support for:
1. **Session-based email+password authentication** (stored in PostgreSQL)
2. **OAuth2 provider integration** (session-based after login, user data upserted to DB)
3. **Redis as session store** for scalability and performance
4. **Industry-leading security algorithms** (Argon2id for passwords, secure session tokens)

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │◄───────►│  Elysia API  │◄───────►│  PostgreSQL │
│  (Browser)  │         │   (Bun.js)   │         │   (Users)   │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │
      │                        │
      │ HTTPOnly Cookie        │ Session Lookup
      │ (molen_session)        ▼
      │                  ┌─────────────┐
      └─────────────────►│    Redis    │
                         │  (Sessions) │
                         └─────────────┘

OAuth2 Flow:
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   Client    │────────►│  Elysia API  │────────►│ OAuth2 Provider│
│             │◄────────│              │◄────────│  (Keycloak)  │
└─────────────┘         └──────────────┘         └──────────────┘
     Redirect             Token Exchange           Authorization
```

## Security Algorithms

### Password Hashing: Argon2id

**Why Argon2id?**
- Winner of the Password Hashing Competition (2015)
- Recommended by OWASP, NSA, and security experts worldwide
- Resistant to both GPU and side-channel attacks
- Memory-hard algorithm (prevents hardware acceleration attacks)

**Parameters (OWASP Recommended):**
```typescript
{
  type: argon2id,        // Hybrid of Argon2i and Argon2d
  memoryCost: 65536,     // 64 MiB memory (GPU-resistant)
  timeCost: 3,           // 3 iterations
  parallelism: 4         // 4 parallel threads
}
```

### Session Tokens: Nanoid

**Why Nanoid?**
- Cryptographically secure random ID generation
- URL-safe characters
- 256-bit entropy (32 characters)
- Collision-resistant
- Fast and efficient

**Parameters:**
```typescript
{
  length: 32,            // 32 characters
  entropy: 256 bits      // Cryptographically secure
}
```

### Session Cookies

**Security Configuration:**
```typescript
{
  httpOnly: true,        // Prevents XSS attacks (no JavaScript access)
  secure: true,          // HTTPS only (production)
  sameSite: 'strict',    // Prevents CSRF attacks
  maxAge: 86400,         // 24 hours default
  path: '/'              // Application-wide
}
```

## Setup Instructions

### 1. Install Dependencies

Already installed in the monorepo:
```bash
cd packages/core
bun install argon2 nanoid postgres ioredis

cd packages/api
bun install @elysiajs/jwt @elysiajs/bearer
```

### 2. Configure Environment Variables

Copy and update `.env.example`:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/molen

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Session Configuration
SESSION_TTL=86400                    # 24 hours in seconds
SESSION_COOKIE_HTTPONLY=true         # Prevent XSS
SESSION_COOKIE_SECURE=false          # Set to true in production (HTTPS)
SESSION_COOKIE_SAMESITE=strict       # Prevent CSRF

# OAuth2 Configuration (Optional)
OAUTH2_ENABLED=false
OAUTH2_PROVIDER=keycloak             # or google, github, auth0, etc.
OAUTH2_CLIENT_ID=your-client-id
OAUTH2_CLIENT_SECRET=your-client-secret
OAUTH2_AUTHORIZATION_URL=https://auth.example.com/realms/your-realm/protocol/openid-connect/auth
OAUTH2_TOKEN_URL=https://auth.example.com/realms/your-realm/protocol/openid-connect/token
OAUTH2_USERINFO_URL=https://auth.example.com/realms/your-realm/protocol/openid-connect/userinfo
OAUTH2_REDIRECT_URI=http://localhost:3000/auth/oauth2/callback
OAUTH2_SCOPES=openid,profile,email
```

### 3. Start Required Services

**PostgreSQL:**
```bash
# Docker
docker run -d \
  --name molen-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=molen \
  -p 5432:5432 \
  postgres:15-alpine

# Or use existing PostgreSQL instance
```

**Redis:**
```bash
# Docker
docker run -d \
  --name molen-redis \
  -p 6379:6379 \
  redis:7-alpine

# Or use existing Redis instance
```

### 4. Initialize Database

The database schema is automatically initialized when the API server starts:

```bash
cd packages/api
bun run dev
```

Check logs for:
```
✅ Authentication schema initialized
```

### 5. Verify Setup

```bash
# Health check
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-...",
  "services": {
    "database": "connected",
    "redis": "connected",
    "auth": "enabled"
  }
}
```

## API Endpoints

### Public Endpoints

#### POST /auth/register
Register a new user with email and password.

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "abc123...",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-...",
    "is_active": true
  },
  "message": "Registration successful"
}
```

**Validation:**
- Email must be valid format
- Password must be at least 8 characters
- Password must contain 3 of: lowercase, uppercase, digit, special character
- Email must be unique

#### POST /auth/login
Login with email and password.

**Request:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "abc123...",
    "email": "user@example.com",
    "full_name": "John Doe"
  },
  "message": "Login successful"
}
```

**Session Cookie:** Set automatically in `molen_session` cookie.

#### POST /auth/logout
Logout from current session.

**Request:**
```bash
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /auth/oauth2/authorize
Initiate OAuth2 authorization flow.

**Request:**
```bash
curl http://localhost:3000/auth/oauth2/authorize
```

**Response:** Redirects to OAuth2 provider's authorization page.

#### GET /auth/oauth2/callback
Handle OAuth2 callback (automatically called by provider).

**Query Parameters:**
- `code` - Authorization code from provider
- `state` - CSRF protection token

**Response:** Redirects to application with session cookie set.

### Protected Endpoints (Require Authentication)

#### GET /auth/me
Get current authenticated user.

**Request:**
```bash
curl http://localhost:3000/auth/me \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "abc123...",
    "email": "user@example.com",
    "fullName": "John Doe"
  }
}
```

#### POST /auth/password
Update password (requires current password).

**Request:**
```bash
curl -X POST http://localhost:3000/auth/password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully. All other sessions have been logged out."
}
```

**Security:** All other sessions are automatically logged out for security.

#### POST /auth/logout-all
Logout from all sessions (all devices).

**Request:**
```bash
curl -X POST http://localhost:3000/auth/logout-all \
  -b cookies.txt
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out from 3 sessions",
  "count": 3
}
```

## OAuth2 Integration

### Supported Providers

The generic OAuth2 client works with any standard OAuth2/OIDC provider:
- Keycloak
- Google
- GitHub
- Microsoft Azure AD
- Auth0
- Okta
- Any OIDC-compliant provider

### Configuration Example (Keycloak)

```env
OAUTH2_ENABLED=true
OAUTH2_PROVIDER=keycloak
OAUTH2_CLIENT_ID=molen-frontend
OAUTH2_CLIENT_SECRET=your-secret-here
OAUTH2_AUTHORIZATION_URL=https://keycloak.example.com/realms/molen/protocol/openid-connect/auth
OAUTH2_TOKEN_URL=https://keycloak.example.com/realms/molen/protocol/openid-connect/token
OAUTH2_USERINFO_URL=https://keycloak.example.com/realms/molen/protocol/openid-connect/userinfo
OAUTH2_REDIRECT_URI=http://localhost:3000/auth/oauth2/callback
OAUTH2_SCOPES=openid,profile,email
```

### OAuth2 Flow

1. User clicks "Login with OAuth2" button
2. Frontend redirects to `/auth/oauth2/authorize`
3. API redirects to OAuth2 provider
4. User authenticates at provider
5. Provider redirects back to `/auth/oauth2/callback?code=...`
6. API exchanges code for token
7. API gets user info from provider
8. API upserts user in database (create or update)
9. API creates session
10. API redirects to application with session cookie

### Account Linking

If a user:
1. Registers with email/password
2. Later logs in with OAuth2 using the same email

The accounts will be automatically linked:
- OAuth provider/subject added to user record
- User can login with either method
- All data preserved

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id VARCHAR(21) PRIMARY KEY,              -- nanoid (21 chars)
  email VARCHAR(255) NOT NULL UNIQUE,      -- Unique email
  password_hash TEXT,                      -- NULL for OAuth2-only users
  full_name VARCHAR(255) NOT NULL,         -- Display name
  oauth_provider VARCHAR(50),              -- 'google', 'keycloak', etc.
  oauth_subject VARCHAR(255),              -- External user ID
  created_at TIMESTAMP WITH TIME ZONE,     -- Account creation
  updated_at TIMESTAMP WITH TIME ZONE,     -- Last update
  last_login_at TIMESTAMP WITH TIME ZONE,  -- Last login
  is_active BOOLEAN DEFAULT TRUE,          -- Soft delete flag
  
  CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_subject)
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email) WHERE is_active = TRUE;
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_subject) WHERE is_active = TRUE;
```

### Redis Session Schema

**Key Pattern:** `session:{sessionId}`

**Value (JSON):**
```json
{
  "userId": "abc123...",
  "email": "user@example.com",
  "fullName": "John Doe",
  "createdAt": 1234567890000,
  "lastAccessedAt": 1234567890000,
  "expiresAt": 1234654290000,
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**TTL:** Automatically expires based on `SESSION_TTL` environment variable.

## Security Best Practices

### Production Deployment

1. **Enable HTTPS:**
   ```env
   SESSION_COOKIE_SECURE=true
   ```

2. **Use Strong Session Secret:**
   ```bash
   # Generate secure random secret
   openssl rand -base64 32
   ```

3. **Configure CORS Properly:**
   ```typescript
   app.use(cors({
     origin: ['https://yourdomain.com'],
     credentials: true,
   }));
   ```

4. **Enable Rate Limiting:**
   ```typescript
   // Add rate limiting middleware to auth routes
   app.use(rateLimit({
     max: 5,
     windowMs: 15 * 60 * 1000, // 15 minutes
   }));
   ```

5. **Monitor Failed Login Attempts:**
   - Log all failed attempts
   - Implement temporary account lockout after N failures
   - Alert on suspicious patterns

### Password Requirements

Enforced by `validatePasswordStrength()`:
- Minimum 8 characters
- Maximum 128 characters
- Must contain 3 of 4: lowercase, uppercase, digit, special character

### Session Management

- **Default TTL:** 24 hours (configurable)
- **Renewal on Access:** Sessions automatically renewed on each request
- **Multi-Device:** Users can have multiple active sessions
- **Logout All:** Security feature to invalidate all sessions

### OAuth2 Security

- **State Parameter:** CSRF protection (generated per request)
- **Token Exchange:** Happens server-side (tokens never exposed to client)
- **HTTPS Required:** OAuth2 should always use HTTPS in production
- **Scope Limitation:** Request only necessary scopes

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql postgresql://postgres:password@localhost:5432/molen

# Check logs for connection errors
bun run dev
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli -h localhost -p 6379 ping

# Check sessions in Redis
redis-cli -h localhost -p 6379
> KEYS session:*
> GET session:{sessionId}
```

### OAuth2 Issues

1. **Invalid Redirect URI:**
   - Ensure `OAUTH2_REDIRECT_URI` matches provider configuration
   - Must be exact match (including protocol, domain, port, path)

2. **Invalid Client Credentials:**
   - Verify `OAUTH2_CLIENT_ID` and `OAUTH2_CLIENT_SECRET`
   - Check provider dashboard for correct values

3. **Scope Issues:**
   - Ensure requested scopes are enabled in provider
   - Common scopes: `openid`, `profile`, `email`

### Common Errors

**"Authentication required":**
- Session expired or invalid
- Cookie not being sent (check CORS, domain)
- Redis connection lost

**"Invalid email or password":**
- Check credentials
- Ensure user exists in database
- Verify password hash is valid

**"User with this email already exists":**
- Email must be unique
- Check if user already registered

## Testing

### Manual Testing

```bash
# 1. Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@test.com","password":"Test123!@#","fullName":"Test User"}'

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@test.com","password":"Test123!@#"}'

# 3. Get User
curl http://localhost:3000/auth/me -b cookies.txt

# 4. Update Password
curl -X POST http://localhost:3000/auth/password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"currentPassword":"Test123!@#","newPassword":"NewTest456!@#"}'

# 5. Logout
curl -X POST http://localhost:3000/auth/logout -b cookies.txt
```

### Integration Testing

Create test file: `packages/api/tests/auth.test.ts`

```typescript
import { describe, it, expect } from 'bun:test';
import app from '../src/index';

describe('Authentication', () => {
  it('should register a new user', async () => {
    const response = await app.handle(
      new Request('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'Test123!@#',
          fullName: 'Test User',
        }),
      })
    );
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.user.email).toBe('test@test.com');
  });
  
  // Add more tests...
});
```

## Performance Considerations

### Redis Performance

- **Connection Pooling:** ioredis automatically pools connections
- **Pipelining:** Use for bulk operations
- **Persistence:** Configure RDB/AOF based on needs

### Database Performance

- **Connection Pooling:** postgres library handles pooling
- **Indexes:** All critical queries are indexed
- **Prepared Statements:** Automatic with postgres library

### Session Performance

- **Memory Usage:** Each session ~500 bytes in Redis
- **Lookup Speed:** O(1) for session retrieval
- **Expiration:** Automatic via Redis TTL

## Next Steps

1. **Add Email Verification:**
   - Send verification email on registration
   - Require email verification before full access

2. **Add Password Reset:**
   - Forgot password flow
   - Secure reset token generation
   - Email-based reset

3. **Add Two-Factor Authentication (2FA):**
   - TOTP support (Google Authenticator, Authy)
   - SMS verification
   - Backup codes

4. **Add Audit Logging:**
   - Log all authentication events
   - Track IP addresses, user agents
   - Security monitoring

5. **Add Rate Limiting:**
   - Prevent brute force attacks
   - Per-IP and per-user limits
   - Sliding window algorithm

6. **Add API Documentation:**
   - OpenAPI/Swagger specification
   - Interactive API explorer
   - Client SDK generation

## Support

For issues or questions:
1. Check this documentation
2. Review the troubleshooting section
3. Check application logs
4. Verify environment variables
5. Test database/Redis connectivity

## License

Part of the Molen Fraud-Ops Control Plane project.
