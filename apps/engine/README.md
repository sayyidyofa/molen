# Molen Engine (Data Plane)

The high-performance fraud detection execution engine for Project Molen, written in Rust.

## 🚀 Features
- **Concurrent**: Dual-loop architecture using `tokio` for non-blocking I/O.
- **Low Latency**: Optimized for real-time transaction processing.
- **Dynamic**: Hot-swaps orchestration graphs via control plane messages without downtime.
- **Type-safe**: Deserializes AST from the Control Plane into strict Rust structs.

## 🛠 Tech Stack
- **Language**: Rust
- **Async Runtime**: `tokio`
- **Messaging**: `rdkafka` (wrapper for `librdkafka`)
- **Serialization**: `serde` / `serde_json`

## 🚦 Getting Started

### 1. Prerequisites
- Rust and Cargo installed.
- `librdkafka` development headers (usually `librdkafka-dev` on Linux).

### 2. Configuration
The engine reads from environment variables (see root `.env`):
- `KAFKA_BROKERS`: List of Kafka brokers.
- `MOLEN_CONTROL_TOPIC`: Topic for graph updates.
- `MOLEN_INBOUND_TOPIC`: Topic for incoming transactions.

### 3. Run
```bash
cargo run
```

### 4. Test
```bash
cargo test
```

## 📂 Project Structure
- `src/main.rs`: Core engine logic, consumer loops, and graph evaluation.
- `Cargo.toml`: Dependency management.

## 🧠 Evaluation Logic
1.  **Extract**: Pulls fields from JSON using paths defined in `FeatureExtractors`.
2.  **Evaluate**: Runs boolean logic for `Rules` or passes data to `Models`.
3.  **Aggregate**: Combines scores using the specified method (AVG, MAX, SUM_CAP).
