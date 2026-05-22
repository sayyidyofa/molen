# Getting Started with Molen

Project Molen is a high-performance fraud detection engine using a "Control Plane" (TypeScript) and a "Data Plane" (Rust).

## 🚀 Prerequisites

- **Bun** (v1.1+)
- **Rust** (v1.75+)
- **Docker & Docker Compose**

## 🛠 Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/sayyidyofa/molen.git
   cd molen
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Start infrastructure**:
   ```bash
   docker compose up -d postgres redpanda minio
   ```

4. **Run the API (Control Plane)**:
   ```bash
   cd apps/api
   bun src/db-init.ts # Initialize database
   bun src/index.ts
   ```

5. **Run the Engine (Data Plane)**:
   ```bash
   cd apps/engine
   cargo run
   ```

6. **Run the Web UI**:
   ```bash
   cd apps/web
   bun dev
   ```

## 🧪 Running Tests

- **API**: `cd apps/api && bun test`
- **Engine**: `cd apps/engine && cargo test`
- **E2E**: `bun test:e2e` (requires all services running)

## 🏗 Project Structure

- `apps/api`: Bun + ElysiaJS Control Plane.
- `apps/engine`: Rust Data Plane for high-volume event processing.
- `apps/web`: React + Vite frontend for graph orchestration.
- `packages/shared-types`: Common TypeScript interfaces.
