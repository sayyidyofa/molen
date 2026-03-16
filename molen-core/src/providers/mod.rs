//! Provider implementations for external services
//!
//! This module contains concrete implementations of the provider traits
//! for interacting with external services like S3, Redis, Kafka, etc.

pub mod storage;

pub use storage::RealStorageProvider;
