//! Molen Core - Shared types and traits for the Fraud-Ops Platform
//!
//! This crate provides the foundational contracts (traits) and data structures
//! used across the Molen fraud detection system.

pub mod traits;
pub mod types;

// Re-export commonly used types
pub use traits::{InferenceProvider, StateProvider, StorageProvider};
pub use types::{Decision, InferenceResult, ModelMetadata, Transaction};
