//! Molen Worker - Inference Engine Service
//!
//! This crate provides the runtime inference service for fraud detection.
//! It includes factories for creating providers and orchestrating the
//! fraud detection pipeline.

pub mod factories;

// Re-export commonly used types
pub use factories::{StorageConfig, StorageFactory, WorkerConfig, WorkerFactory};
