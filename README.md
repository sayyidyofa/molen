# Molen: High-Performance Fraud Detection Platform

**Rust-Based Ultra-Low Latency Fraud-Ops Platform**

Molen is a self-service fraud detection platform built in Rust, delivering ultra-low latency (15-30ms) inference for real-time transaction processing.

## 🎯 Key Features

### Ultra-Low Latency
- **15-30ms Target:** Rust-powered inference engine
- **Async I/O:** Tokio-based runtime for maximum throughput
- **Zero-Copy:** Efficient memory management
- **Production-Ready:** Deployable as binary or container

### Self-Service ML Lifecycle
- **Train Models:** XGBoost model training pipeline
- **Shadow Mode:** Test candidate models safely
- **Model Comparison:** Accuracy, precision, recall metrics
- **Version Control:** S3-based model storage

### Real-Time Fraud Detection
- **Kafka Integration:** Stream processing at scale
- **State Management:** Redis for velocity tracking
- **Storage Backend:** S3-compatible (Cloudflare R2, MinIO)
- **Analytics:** Elasticsearch integration

## Architecture

**Hybrid Rust + React Architecture**

This project combines Rust for high-performance backend with React for the frontend:

### Backend (Rust Cargo Workspace)
- **molen-core**: Shared types, traits, and core logic
- **molen-worker**: Inference engine service (15-30ms latency target)
- **molen-api**: Control plane/management service

### Frontend (React)
- **frontend/**: Self-service UI for graph building
  - React 19 + TypeScript
  - React Flow for visual graph editor
  - Zustand state management
  - Comprehensive test coverage (13 tests)

### Technology Stack

**Backend:**
- **Language:** Rust (async/await with Tokio)
- **Message Broker:** Kafka (rdkafka)
- **State Store:** Redis
- **Object Storage:** S3-compatible (aws-sdk-s3)
- **Analytics:** Elasticsearch
- **Serialization:** Serde

**Frontend:**
- **Framework:** React 19 + Vite
- **Language:** TypeScript 5.9 (strict)
- **UI Library:** React Flow (@xyflow/react)
- **Styling:** Tailwind CSS 4
- **State:** Zustand
- **Testing:** Vitest + React Testing Library

See [RUST_WORKSPACE_README.md](./RUST_WORKSPACE_README.md) for backend details.
See [frontend/IMPLEMENTATION_SUMMARY.md](./frontend/IMPLEMENTATION_SUMMARY.md) for frontend details.

## Quick Start

### Backend (Rust)

See [RUST_WORKSPACE_README.md](./RUST_WORKSPACE_README.md) for detailed setup instructions.

### Prerequisites

**Backend:**
- [Rust](https://rustup.rs/) >= 1.70.0
- Cargo (comes with Rust)
- Docker (optional, for infrastructure)

**Frontend:**
- [Node.js](https://nodejs.org/) >= 18.0.0
- npm (comes with Node.js)

### Installation

**Backend:**
```bash
git clone https://github.com/sayyidyofa/molen.git
cd molen
cargo build --release
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 for the UI

### Running Tests

```bash
# Run all tests
cargo test

# Run specific crate tests
cargo test -p molen-core
cargo test -p molen-worker

# With output
cargo test -- --nocapture
```

### Development

```bash
# Build all crates
cargo build

# Build specific crate
cargo build -p molen-worker

# Run with logging
RUST_LOG=debug cargo run -p molen-worker
```

### Infrastructure

Start required infrastructure with Docker:

```bash
# Start infrastructure services
docker-compose -f docker-compose.infra.yml up -d
```

## Project Status

**Current Phase:** Backend scaffolding complete + Frontend MVP ready

### Backend (Rust)
- ✅ Cargo workspace defined
- ✅ Core traits and data structures
- ✅ Factory patterns
- ✅ Test infrastructure
- ✅ Phase 2 orchestration contracts
- ⏳ Implementation in progress

### Frontend (React)
- ✅ Graph builder UI
- ✅ Custom node components
- ✅ Mock backend service
- ✅ State management (Zustand)
- ✅ Comprehensive tests (13/13 passing)
- ✅ Type definitions (future-proof for specta)
- ✅ Production build ready

See [RUST_PIVOT_SUMMARY.md](./RUST_PIVOT_SUMMARY.md) and [frontend/IMPLEMENTATION_SUMMARY.md](./frontend/IMPLEMENTATION_SUMMARY.md) for complete details.

## Documentation

### Backend
- [RUST_WORKSPACE_README.md](./RUST_WORKSPACE_README.md) - Workspace structure and getting started
- [RUST_PIVOT_SUMMARY.md](./RUST_PIVOT_SUMMARY.md) - Implementation summary
- [RUST_VERIFICATION.md](./RUST_VERIFICATION.md) - Verification checklist
- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - Developer guide for TypeScript devs
- [PHASE2_SUMMARY.md](./PHASE2_SUMMARY.md) - Phase 2 orchestration summary

### Frontend
- [frontend/IMPLEMENTATION_SUMMARY.md](./frontend/IMPLEMENTATION_SUMMARY.md) - Complete frontend documentation
- [frontend/README.md](./frontend/README.md) - Getting started with frontend

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `cargo test`
5. Submit a pull request

## License

Proprietary - Internal use only
