# Contributing to Project Molen

First off, thank you for considering contributing to Project Molen!

## 📜 Code of Conduct

Maintain a professional and inclusive environment. Focus on technical excellence and clear communication.

## 🛠 Development Workflow

1.  **Issue Selection**: Pick an issue from the backlog or open a new one to discuss proposed changes.
2.  **Branching**: Use descriptive branch names: `feat/xxx`, `fix/xxx`, `refactor/xxx`.
3.  **Local Testing**: Ensure your changes are tested against the local infrastructure (Postgres, Redpanda).
4.  **Pull Request**: Submit a PR with a clear description of changes and verification steps.

## 💻 Coding Standards

### TypeScript (Frontend & API)
- Use **Strict Mode** in `tsconfig.json`.
- Prefer `interface` over `type` for public-facing contracts.
- Use functional components and hooks for React.
- Ensure all API endpoints are documented (automatic with Elysia/Swagger).

### Rust (Engine)
- Follow `cargo fmt` and `cargo clippy`.
- Use `tokio` for asynchronous tasks.
- Ensure errors are handled gracefully (avoid `unwrap()` where possible).
- Document complex logic with comments.

### Shared Types
- When updating `packages/shared-types`, remember to run `bun install` at the root to sync workspace links.
- Ensure changes are backward-compatible or include migration paths for the Engine and API.

## 🧪 Testing Guidelines

- **Unit Tests**: Add unit tests for core logic (e.g., aggregation math in the Engine).
- **Integration Tests**: Verify end-to-end flow between API and Redpanda.
- **Frontend Tests**: Use React Testing Library for critical UI components.

## 🏗 Monorepo Management

We use **Bun Workspaces**. 
- Add dependencies to a specific package: `cd apps/xxx && bun add <pkg>`
- Run root tasks:
  - `bun dev:api` - Start the Control Plane.
  - `bun dev:web` - Start the Frontend.
  - `bun dev:engine` - Start the Rust Data Plane.
  - `bun db:init` - Initialize the Postgres schema.

## 🧱 The "Molen Wrap" Philosophy

Every change should respect the type contract established in `packages/shared-types`. If you change the Orchestrator AST, you MUST update:
1.  The TypeScript definitions.
2.  The API serialization logic.
3.  The Rust engine deserialization structs.

Failure to do so breaks the Data Plane execution.
