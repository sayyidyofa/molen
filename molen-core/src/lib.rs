//! Molen Core - Shared types and traits for the Fraud-Ops Platform
//!
//! This crate provides the foundational contracts (traits) and data structures
//! used across the Molen fraud detection system.

pub mod providers;
pub mod traits;
pub mod types;

// Re-export commonly used types
pub use traits::{
    Alert, AlertQuery, AnalyticsProvider, EventStreamProvider, InferenceProvider, StateProvider,
    StorageProvider,
};
pub use types::{Decision, InferenceResult, ModelMetadata, Transaction};

// Re-export provider implementations
pub use providers::*;
