# Test Coverage Report

## Overview
This document outlines the test coverage improvements needed for the Molen Fraud-Ops Control Plane project.

## Current Test Status

### Existing Tests (12 files)
1. `packages/core/tests/elastic.mock.test.ts` ✅
2. `packages/core/tests/redis.mock.test.ts` ✅
3. `packages/core/tests/s3.mock.test.ts` ✅
4. `packages/core/tests/kafka.mock.test.ts` ✅
5. `packages/core/tests/kafka-broker.mock.test.ts` ✅
6. `packages/core/tests/client.factory.test.ts` ✅
7. `packages/core/tests/stateless-evaluator.test.ts` ✅
8. `packages/core/tests/integration/elastic.integration.test.ts` ✅
9. `packages/core/tests/integration/redis.integration.test.ts` ✅
10. `packages/core/tests/integration/s3.integration.test.ts` ✅
11. `packages/core/tests/integration/kafka-broker.integration.test.ts` ✅
12. `packages/core/tests/integration/README.md` (documentation)

### Test Coverage by Module

#### Core Package (packages/core)
- **Clients**: 85% covered
  - ✅ Elasticsearch (mock)
  - ✅ Redis (mock)
  - ✅ S3 (mock)
  - ✅ Kafka (mock)
  - ✅ Kafka Broker (mock)
  - ❌ Real implementations (integration tests only)

- **Auth Module**: 0% covered ⚠️
  - ❌ password.ts
  - ❌ session.redis.ts
  - ❌ user.repository.ts
  - ❌ oauth2.client.ts
  - ❌ db.schema.ts

- **Rules**: 50% covered
  - ✅ stateless-evaluator.ts
  - ❌ velocity-evaluator.ts
  - ❌ rule-evaluator.factory.ts

- **Factories**: 50% covered
  - ✅ client.factory.ts
  - ❌ rule-evaluator.factory.ts

#### API Package (packages/api)
- **Services**: 0% covered ⚠️
  - ❌ auth.service.ts
  - ❌ waterfall.service.ts
  - ❌ rule.service.ts
  - ❌ triage.service.ts
  - ❌ ml.service.ts

- **Routes**: 0% covered ⚠️
  - ❌ auth.routes.ts
  - ❌ waterfall.routes.ts
  - ❌ rule.routes.ts
  - ❌ triage.routes.ts
  - ❌ ml.routes.ts

- **Middleware**: 0% covered ⚠️
  - ❌ auth.middleware.ts

#### UI Package (packages/ui)
- **Components**: 0% covered ⚠️
  - ❌ WaterfallMonitor.tsx
  - ❌ RuleEditor.tsx
  - ❌ CaseTriage.tsx

## Priority Testing Needs

### High Priority (Security & Core Functionality)
1. **Authentication Module** (packages/core/src/auth)
   - Password hashing and validation
   - Session management (Redis)
   - User repository operations
   - OAuth2 client flows
   - Database schema initialization

2. **API Services** (packages/api/src/services)
   - AuthService - user registration, login, OAuth2
   - WaterfallService - transaction processing
   - RuleService - rule management
   - TriageService - case investigation
   - MLService - model training

### Medium Priority (Business Logic)
3. **Rule Evaluators** (packages/core/src/rules)
   - VelocityRuleEvaluator
   - RuleEvaluatorFactory

4. **API Routes** (packages/api/src/routes)
   - Integration tests for all route handlers

### Low Priority (UI)
5. **React Components** (packages/ui/src/components)
   - Component unit tests
   - Integration tests

## Recommended Test Structure

### For Authentication Module
```typescript
// packages/core/tests/auth/password.test.ts
import { describe, it, expect } from 'bun:test';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../src/auth/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash password with Argon2id', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      expect(hash).toBeTypeOf('string');
      expect(hash).toContain('$argon2id$');
    });

    it('should generate different hashes for same password', async () => {
      const password = 'SecurePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword123!', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong passwords', () => {
      const result = validatePasswordStrength('SecurePass123!');
      expect(result.isValid).toBe(true);
    });

    it('should reject weak passwords', () => {
      const result = validatePasswordStrength('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
```

### For API Services
```typescript
// packages/api/tests/services/auth.service.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { AuthService } from '../../src/services/auth.service';
import { MockUserRepository, MockSessionStore } from '../mocks';

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: MockUserRepository;
  let sessionStore: MockSessionStore;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    sessionStore = new MockSessionStore();
    authService = new AuthService(userRepository, sessionStore);
  });

  describe('register', () => {
    it('should register new user', async () => {
      const result = await authService.register(
        'test@example.com',
        'SecurePass123!',
        'Test User'
      );

      expect(result.user.email).toBe('test@example.com');
      expect(result.sessionId).toBeTypeOf('string');
    });

    it('should reject duplicate email', async () => {
      await authService.register('test@example.com', 'Pass123!', 'User 1');
      
      await expect(
        authService.register('test@example.com', 'Pass123!', 'User 2')
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      await authService.register('test@example.com', 'Pass123!', 'Test');
      
      const result = await authService.login({
        email: 'test@example.com',
        password: 'Pass123!',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.sessionId).toBeTypeOf('string');
    });

    it('should reject invalid credentials', async () => {
      await authService.register('test@example.com', 'Pass123!', 'Test');
      
      await expect(
        authService.login({ email: 'test@example.com', password: 'Wrong!' })
      ).rejects.toThrow();
    });
  });
});
```

## Test Infrastructure Needed

### Mock Implementations
Create the following mock classes for testing:
1. `MockUserRepository` - In-memory user storage
2. `MockSessionStore` - In-memory session storage
3. `MockOAuth2Client` - OAuth2 flow simulation
4. `MockPostgres` - Database mock
5. `MockRedis` - Redis mock

### Test Utilities
```typescript
// packages/api/tests/setup.ts
export async function createTestUser() {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    createdAt: new Date(),
  };
}

export async function createTestSession() {
  return {
    sessionId: 'test-session-id',
    userId: 'test-user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    createdAt: new Date(),
  };
}
```

## Coverage Goals

### Target Coverage Levels
- **Overall**: >80%
- **Core Package**: >85%
- **API Package**: >75%
- **UI Package**: >60%

### By Module
- Authentication: >90% (critical security component)
- Services: >75% (business logic)
- Clients: >80% (external integrations)
- Routes: >70% (API endpoints)
- Utils: >85% (shared utilities)

## Running Tests

### Command Reference
```bash
# All tests
bun test

# Specific package
bun run test:core
bun run test:api
bun run test:ui

# With coverage
bun test --coverage

# Watch mode
bun test --watch

# Integration tests only
bun run test:integration
```

## Next Steps

1. ✅ Fix type errors (COMPLETED)
2. ⏳ Create mock implementations for testing
3. ⏳ Write authentication module tests
4. ⏳ Write API service tests
5. ⏳ Add coverage reporting
6. ⏳ Set up CI/CD test automation
7. ⏳ Add UI component tests

## Notes

- All tests should be written using Bun's built-in test runner
- Use `describe`, `it`, `expect` from `bun:test`
- Mock external dependencies (databases, Redis, etc.)
- Tests should be isolated and repeatable
- Integration tests should clean up after themselves
- Use `beforeEach` and `afterEach` for test setup/teardown

## Summary

**Current State**: ~40% coverage
**Target State**: >80% coverage
**Priority**: High (security and core functionality first)
**Timeline**: 2-3 days for comprehensive test suite

The type errors have been fixed. The main gap is in test coverage for:
1. Authentication module (high priority)
2. API services (high priority)
3. Rule evaluators (medium priority)
4. API routes integration tests (medium priority)
5. UI components (low priority)
