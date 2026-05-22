# Molen API (Control Plane)

The Control Plane for Project Molen, built with Bun and Elysia.

## 🚀 Features
- **Fast**: Leverages Bun's high-performance runtime.
- **Type-safe**: Shared types with the frontend and mirrored in the Data Plane.
- **Real-time**: Publishes deployment events to Redpanda.
- **Documentation**: Built-in Swagger UI at `/swagger`.

## 🛠 Tech Stack
- **Runtime**: Bun
- **Framework**: ElysiaJS
- **Database**: PostgreSQL (via `postgres.js`)
- **Messaging**: Kafka (via `kafkajs`)

## 🚦 Getting Started

### 1. Install Dependencies
```bash
bun install
```

### 2. Environment Setup
Ensure the root `.env` is configured and accessible.

### 3. Initialize & Seed
```bash
bun run src/db-init.ts
bun run src/seed.ts
```

### 4. Development
```bash
bun run src/index.ts
```

## 📂 Project Structure
- `src/index.ts`: Entry point and route definitions.
- `src/db.ts`: Database connection and schema helpers.
- `src/db-init.ts`: Schema migration script.
- `src/seed.ts`: Mock data seeder.
