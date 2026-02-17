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

**Rust Cargo Workspace**

This project uses a **Cargo workspace** architecture:

- **molen-core**: Shared types, traits, and core logic
- **molen-worker**: Inference engine service
- **molen-api**: Control plane/management service

### Technology Stack

- **Language:** Rust (async/await with Tokio)
- **Message Broker:** Kafka (rdkafka)
- **State Store:** Redis
- **Object Storage:** S3-compatible (aws-sdk-s3)
- **Analytics:** Elasticsearch
- **Serialization:** Serde

See [RUST_WORKSPACE_README.md](./RUST_WORKSPACE_README.md) for detailed workspace structure.

## Quick Start

See [RUST_WORKSPACE_README.md](./RUST_WORKSPACE_README.md) for detailed setup instructions.

### Prerequisites

- [Rust](https://rustup.rs/) >= 1.70.0
- Cargo (comes with Rust)
- Docker (optional, for infrastructure)

### Installation

```bash
git clone https://github.com/sayyidyofa/molen.git
cd molen
cargo build --release
```

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

**Current Phase:** Initial Rust workspace scaffolding complete

- ✅ Cargo workspace defined
- ✅ Core traits and data structures
- ✅ Factory patterns
- ✅ Test infrastructure
- ⏳ Implementation in progress

See [RUST_PIVOT_SUMMARY.md](./RUST_PIVOT_SUMMARY.md) and [RUST_VERIFICATION.md](./RUST_VERIFICATION.md) for complete details.

## Documentation

- [RUST_WORKSPACE_README.md](./RUST_WORKSPACE_README.md) - Workspace structure and getting started
- [RUST_PIVOT_SUMMARY.md](./RUST_PIVOT_SUMMARY.md) - Implementation summary
- [RUST_VERIFICATION.md](./RUST_VERIFICATION.md) - Verification checklist

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `cargo test`
5. Submit a pull request

## License

Proprietary - Internal use only
