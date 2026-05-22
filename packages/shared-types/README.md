# Molen Shared Types

The core type contract for Project Molen. This package ensures that the API and Frontend speak the same language.

## 🧱 The "Molen Wrap"

This package defines the interfaces and enums used across the monorepo. It is the "source of truth" for:
- Data types (`NUMBER`, `STRING`, `BOOLEAN`, etc.)
- Rule Actions (`BLOCK`, `FLAG`, `PASS`)
- Orchestrator Graph AST (Nodes and Edges)
- Deployment lifecycle states.

## 🛠 Usage

This is a local workspace package.

### Adding to a component
In `apps/api` or `apps/web`:
```json
"dependencies": {
  "@molen/shared-types": "workspace:*"
}
```

### Development
After making changes to `src/index.ts`, run `bun install` at the root to ensure all workspace links are updated.

## 📂 Structure
- `src/index.ts`: All type definitions and exports.
