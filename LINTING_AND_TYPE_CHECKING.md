# Linting and Type Checking Guide

## Overview
This document describes the linting and type checking setup for the Molen Fraud-Ops Control Plane project.

## Configuration Files

### ESLint Configuration (.eslintrc.js)
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-inferrable-types': 'off',
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '*.config.js',
    '*.config.ts',
  ],
};
```

### TypeScript Configuration (tsconfig.json)
Root configuration uses project references for the monorepo structure.

## Running Checks

### Type Checking
```bash
# Check all packages
bun run typecheck

# Check individual packages
bun run typecheck:core
bun run typecheck:api
bun run typecheck:ui
```

### Linting
```bash
# Lint all packages
bun run lint

# Lint with auto-fix
bun run lint:fix

# Lint specific files
eslint packages/core/src/**/*.ts
```

## Fixed Issues

### Type Errors Fixed ✅

1. **Database Schema (packages/core/src/auth/db.schema.ts)**
   - Changed `sql: any` → `sql: Sql`
   - Added proper type import from 'postgres'

2. **Elasticsearch Client**
   - Created `ElasticsearchResponse<T>` generic type
   - Created `SearchParams` and `IndexParams` interfaces
   - Removed all `any` types from search and index methods
   - Added proper ClientOptions type

3. **S3 Client**
   - Created `UploadModelResponse` interface
   - Changed `Promise<any>` → `Promise<UploadModelResponse>`
   - Updated both mock and real implementations

4. **Auth Middleware**
   - Changed `cookie: any` → `cookie: Record<string, any>`
   - Fixed in setSessionCookie and clearSessionCookie functions

### Linting Issues Fixed ✅

1. **Unused Variables**
   - Prefixed intentionally unused parameters with `_`
   - Removed truly unused imports

2. **Explicit Any Types**
   - Replaced with proper TypeScript types
   - Added interfaces where needed
   - Used generic types for flexibility

3. **Import Organization**
   - Organized imports by category (external, internal, types)
   - Removed duplicate imports

## Current Status

### Type Checking
- ✅ Core package: No errors
- ✅ API package: No errors
- ✅ UI package: No errors

### Linting
- ✅ No errors
- ⚠️ Some warnings for `any` types (acceptable in specific cases)

## Type Safety Guidelines

### Do's ✅
1. Use specific types instead of `any`
2. Create interfaces for complex objects
3. Use generics for reusable code
4. Type function parameters and return values
5. Use `unknown` instead of `any` when type is truly unknown

### Don'ts ❌
1. Don't use `any` unless absolutely necessary
2. Don't use `as any` type assertions
3. Don't ignore TypeScript errors with `@ts-ignore`
4. Don't use `Object` or `Function` types
5. Don't leave implicit `any` in code

## Examples

### Good Type Usage ✅
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
}

async function getUser(id: string): Promise<User> {
  // Implementation
}

function processData<T>(data: T[]): T[] {
  return data.filter(item => item !== null);
}
```

### Bad Type Usage ❌
```typescript
async function getUser(id: any): Promise<any> {
  // Don't use any!
}

function processData(data: any): any {
  return data as any; // Don't use any or as any!
}
```

## Continuous Integration

### Pre-commit Hooks (Recommended)
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "bun run typecheck && bun run lint"
    }
  }
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run typecheck
      - run: bun run lint
      - run: bun test
```

## IDE Configuration

### VS Code Settings (Recommended)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Common Issues and Solutions

### Issue: "Cannot find module"
**Solution**: Ensure all dependencies are installed
```bash
bun install
```

### Issue: "Implicit any type"
**Solution**: Add explicit type annotations
```typescript
// Before
function process(data) { }

// After
function process(data: MyDataType) { }
```

### Issue: "Unused variable"
**Solution**: Prefix with underscore or remove
```typescript
// If intentionally unused
function handler(_req: Request, res: Response) { }

// If truly unused
// Just remove the variable
```

## Performance Tips

1. **Use Project References**: Already configured in tsconfig.json
2. **Incremental Compilation**: TypeScript caches type information
3. **Parallel Linting**: ESLint can run on multiple files simultaneously
4. **Watch Mode**: Use for development
   ```bash
   bun run typecheck --watch
   ```

## Summary

✅ **Type Errors**: All fixed
✅ **Linting Errors**: All fixed
✅ **Configuration**: Properly set up
✅ **Documentation**: Complete
⏳ **Test Coverage**: See TEST_COVERAGE_REPORT.md

The codebase now has:
- Proper type safety
- Consistent code style
- No linting errors
- Comprehensive type checking
- Good maintainability

Ready for production deployment!
