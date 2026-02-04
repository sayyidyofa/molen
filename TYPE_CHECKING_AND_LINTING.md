# Type Checking and Linting Setup

This document describes the TypeScript type checking and ESLint linting configuration for the Molen monorepo.

## TypeScript Configuration

### Root Configuration

A root `tsconfig.json` has been added to enable workspace-level type checking using TypeScript project references:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/api" },
    { "path": "./packages/ui" }
  ]
}
```

### Package Configurations

Each package has its own `tsconfig.json` that extends the base configuration from `packages/config/tsconfig.base.json`:

- **packages/core**: Configured for Node.js with composite mode for project references
- **packages/api**: Configured for Bun runtime with appropriate types
- **packages/ui**: Configured for React with JSX support and Vite

### Type Checking Scripts

All packages now have `typecheck` scripts that run TypeScript compiler in no-emit mode:

```bash
# Check all packages
bun run typecheck

# Check individual packages
bun run typecheck:core
bun run typecheck:api
bun run typecheck:ui
```

## ESLint Configuration

### Root Configuration

A comprehensive ESLint configuration has been added at the root level (`.eslintrc.js`):

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
};
```

### Ignore Configuration

An `.eslintignore` file excludes generated files and dependencies:

```
node_modules
dist
build
*.config.js
*.config.ts
coverage
.git
```

### Linting Scripts

```bash
# Lint all packages
bun run lint

# Lint and auto-fix issues
bun run lint:fix
```

## Type Safety Improvements

### API Package

1. **Type Definitions** (`packages/api/src/types/api.types.ts`):
   - `Rule`: Interface for fraud detection rules
   - `RuleUpdate`: Interface for rule updates
   - `FlaggedCase`: Interface for flagged transactions
   - `TriageResult`: Interface for triage query results

2. **Service Updates**:
   - `RuleService`: Now uses `Rule[]` and `RuleUpdate` types
   - `TriageService`: Now uses `TriageResult` and `FlaggedCase` types
   - `WaterfallService`: Already had proper types from core package

3. **Route Updates**:
   - All route handlers now use proper types instead of `any`
   - Type assertions are used appropriately for request bodies

### Core Package

1. **Type Updates**:
   - `Transaction.metadata`: Changed from `Record<string, any>` to `Record<string, unknown>`
   - `RuleEvaluatorConfig`: New interface for rule evaluator configuration
   - Unused parameters prefixed with `_` to satisfy linting rules

2. **Factory Updates**:
   - `RuleEvaluatorFactory.createCombinedEvaluator`: Now uses `RuleEvaluatorConfig` type

### UI Package

1. **Type Definitions** (`packages/ui/src/types/api.types.ts`):
   - `Transaction`: Interface matching core package
   - `Rule`, `RuleUpdate`: Interfaces for rule management
   - `FlaggedCase`: Interface for triage cases
   - `EvaluationResult`: Interface for rule evaluation results
   - Response types for all API calls

2. **Component Updates**:
   - `WaterfallMonitor`: Uses `ProcessTransactionResponse` type
   - `RuleEditor`: Uses `Rule[]` type
   - `CaseTriage`: Uses `FlaggedCase` type

3. **API Client Updates**:
   - Generic type parameter for all API calls
   - Proper return types for all methods
   - No more `any` types in method signatures

## Benefits

1. **Type Safety**: Catch type errors at compile time
2. **Better IDE Support**: Improved autocomplete and inline documentation
3. **Refactoring Confidence**: TypeScript helps ensure changes don't break existing code
4. **Code Quality**: ESLint enforces consistent code style and catches common errors
5. **Documentation**: Types serve as inline documentation for APIs

## Remaining Acceptable `any` Types

Some `any` types remain in the codebase and are acceptable:

1. **Elasticsearch Responses**: Dynamic responses from Elasticsearch are typed as `any` because their structure varies based on queries
2. **Interface Methods**: Some interface methods use `object` or `any` for parameters that accept arbitrary structures

These are marked with comments where appropriate and should not be changed unless the Elasticsearch TypeScript client is fully integrated with proper types.

## CI/CD Integration

Type checking and linting should be integrated into the CI/CD pipeline:

```bash
# Add to CI pipeline
bun run typecheck
bun run lint
```

This ensures all code merged to main branches passes type checking and linting requirements.
