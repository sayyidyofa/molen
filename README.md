# Project Molen

Project Molen is an Enterprise Fraud-Ops Internal Developer Platform (IDP) designed for high-performance fraud detection and orchestration. It leverages a modern stack to provide a type-safe, real-time data processing environment.

## 🏗 Architecture Overview

The project is organized as a monorepo with the following components:

- **`apps/web`**: React-based frontend for orchestrating fraud detection workflows. Reactive UI wired to the Control Plane.
- **`apps/api`** (Control Plane): Bun + Elysia API managing the state in PostgreSQL and publishing orchestration graphs to Redpanda.
- **`apps/engine`** (Data Plane): High-performance Rust engine that consumes transaction streams and executes orchestration graphs in real-time.
- **`packages/shared-types`**: Shared TypeScript type definitions ensuring a "Molen Wrap" type safety across the TS/JS components.
- **Infrastructure**: Local development relies on Docker Compose (PostgreSQL, Redpanda, MinIO).

## 🚀 Quick Start

See the [Usage Guide](./USAGE_GUIDE.md) for a detailed walkthrough.

### 1. Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/)

### 2. Fast Track
```bash
cp .env.example .env
bun infra:up
bun install
bun db:init
bun db:seed

# Run all components (in separate terminals)
bun dev:api
bun dev:web
bun dev:engine
```

## ✨ Key Features

- **Visual Orchestration**: Drag-and-drop interface for building complex fraud detection logic.
- **Molen Wrap Safety**: Shared types between TypeScript and Rust ensure your execution engine never deviates from your UI's intent.
- **Real-time Deployment**: Instantly push new fraud rules to the production engine via Redpanda.
- **High-Performance Execution**: Rust-based data plane capable of processing thousands of transactions per second.
- **Unified Infrastructure**: Integrated PostgreSQL, Redpanda, and MinIO for a complete local dev experience.

## 📜 Key Workflows

1.  **Define**: Create features, rules, and models in the Web UI.
2.  **Orchestrate**: Use the Canvas to link components into a graph.
3.  **Deploy**: Promoting a version publishes the AST to the `molen_control_dev` topic.
4.  **Execute**: The Rust Engine receives the update and applies the new logic to incoming transactions on `molen_transactions_in`.

## 🛠 Tech Stack

- **Frontend**: React, Vite, TailwindCSS, @tanstack/react-query, @xyflow/react.
- **API**: Bun, Elysia, Postgres.js.
- **Engine**: Rust, Tokio, rdkafka, Serde.
- **Infra**: Redpanda (Kafka-compatible), PostgreSQL, MinIO (S3-compatible).

---
See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines and [ARCHITECTURE.md](./ARCHITECTURE.md) for deep-dive technical details.
