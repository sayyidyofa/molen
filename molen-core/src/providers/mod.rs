//! Provider implementations for external services
//!
//! This module contains concrete implementations of the provider traits
//! for interacting with external services like S3, Redis, Kafka, etc.

pub mod storage;
pub mod state;
pub mod events;
pub mod analytics;
pub mod inference;

pub use storage::RealStorageProvider;
pub use state::RealStateProvider;
pub use events::RealEventStreamProvider;
pub use analytics::RealAnalyticsProvider;
pub use inference::RealInferenceProvider;
