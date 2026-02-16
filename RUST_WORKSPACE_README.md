# Molen - Rust Workspace

This is the Rust implementation of the Molen Fraud-Ops Internal Developer Platform (IDP).

## Project Structure

This project is organized as a Cargo workspace with the following crates:

### molen-core
Shared types and primary traits for the fraud detection platform.

**Key Components:**
- **Data Structures**: `Transaction`, `InferenceResult`, `ModelMetadata`, `Decision` enum
- **Traits**: `InferenceProvider`, `StorageProvider`, `StateProvider`

### molen-worker
The inference engine service that performs real-time fraud detection.

**Key Components:**
- **Factories**: `WorkerFactory`, `StorageFactory`
- Runtime inference orchestration

### molen-api
The control plane/management service for model deployment and configuration.

**Status**: Skeleton only - not yet implemented

## Architecture Principles

### Clean Code & Separation of Concerns
- All IO operations are isolated into trait implementations
- Core business logic remains pure and testable
- Async operations use `async-trait` for clean interfaces

### Ultra-Low Latency
- Target: 15-30ms end-to-end processing
- Optimized for high-throughput fraud detection
- Efficient memory usage and minimal allocations

### Deployment Flexibility
- Can be deployed as a standalone binary
- Can be deployed as a lightweight container
- Minimal runtime dependencies

## Current Status

**⚠️ All implementations use `todo!()` macro**

This is an initial scaffold with contracts (traits) and data structures defined.
No implementations are provided yet. All tests are expected to fail with
"not yet implemented" panic.

## Building

```bash
# Build all crates
cargo build

# Build specific crate
cargo build -p molen-core
cargo build -p molen-worker

# Build in release mode (optimized)
cargo build --release
```

## Testing

```bash
# Run all tests (will fail due to todo!() implementations)
cargo test

# Run tests for specific crate
cargo test -p molen-core
cargo test -p molen-worker

# Run tests with output
cargo test -- --nocapture
```

Expected output: All tests should panic with "not yet implemented"

## Dependencies

- **tokio**: Async runtime
- **async-trait**: Async trait support
- **serde**: Serialization/deserialization
- **anyhow**: Error handling
- **thiserror**: Custom error types

## Next Steps

1. Implement `InferenceProvider` for XGBoost models
2. Implement `StorageProvider` for S3/Garage interaction
3. Implement `StateProvider` for Redis operations
4. Implement factory logic in `molen-worker`
5. Build out `molen-api` control plane

## Documentation

Run `cargo doc --open` to view the full API documentation.

## License

MIT
