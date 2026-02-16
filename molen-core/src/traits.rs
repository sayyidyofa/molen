//! Core traits (contracts) for the Molen platform
//!
//! These traits define the interfaces for fraud detection components.
//! All implementations should maintain clean separation of concerns,
//! with IO operations isolated from business logic.

use crate::types::{Decision, InferenceResult, ModelMetadata, Transaction};
use async_trait::async_trait;
use std::collections::HashMap;

/// Provider for executing fraud detection inference
///
/// This trait abstracts the inference engine, allowing different
/// implementations (XGBoost, Neural Networks, Mock, etc.)
#[async_trait]
pub trait InferenceProvider: Send + Sync {
    /// Execute fraud detection inference on a transaction
    ///
    /// # Arguments
    /// * `transaction` - The transaction to evaluate
    ///
    /// # Returns
    /// * `InferenceResult` containing the fraud score and decision
    ///
    /// # Errors
    /// Returns an error if inference fails
    async fn infer(&self, transaction: &Transaction) -> anyhow::Result<InferenceResult>;

    /// Load a specific model version
    ///
    /// # Arguments
    /// * `model_metadata` - Metadata about the model to load
    ///
    /// # Errors
    /// Returns an error if model loading fails
    async fn load_model(&mut self, model_metadata: &ModelMetadata) -> anyhow::Result<()>;

    /// Get the currently loaded model version
    fn get_model_version(&self) -> String;
}

/// Provider for interacting with object storage (S3/Garage)
///
/// This trait handles loading and storing model weights and training data
#[async_trait]
pub trait StorageProvider: Send + Sync {
    /// Load model weights from storage
    ///
    /// # Arguments
    /// * `path` - S3/Garage path to the model weights
    ///
    /// # Returns
    /// * Byte vector containing the model weights
    ///
    /// # Errors
    /// Returns an error if the model cannot be loaded
    async fn load_model(&self, path: &str) -> anyhow::Result<Vec<u8>>;

    /// Save model weights to storage
    ///
    /// # Arguments
    /// * `path` - S3/Garage path where to save the model
    /// * `data` - Model weights as bytes
    ///
    /// # Errors
    /// Returns an error if saving fails
    async fn save_model(&self, path: &str, data: &[u8]) -> anyhow::Result<()>;

    /// List available models in storage
    ///
    /// # Arguments
    /// * `prefix` - Path prefix to filter models
    ///
    /// # Returns
    /// * Vector of model paths
    ///
    /// # Errors
    /// Returns an error if listing fails
    async fn list_models(&self, prefix: &str) -> anyhow::Result<Vec<String>>;

    /// Get metadata for a specific model
    ///
    /// # Arguments
    /// * `path` - S3/Garage path to the model
    ///
    /// # Returns
    /// * Model metadata
    ///
    /// # Errors
    /// Returns an error if metadata cannot be retrieved
    async fn get_model_metadata(&self, path: &str) -> anyhow::Result<ModelMetadata>;
}

/// Provider for stateful operations (Redis)
///
/// This trait handles velocity counters, blacklists, and other
/// stateful fraud detection features
#[async_trait]
pub trait StateProvider: Send + Sync {
    /// Get velocity counter for a user
    ///
    /// # Arguments
    /// * `user_id` - User identifier
    /// * `window_seconds` - Time window in seconds
    ///
    /// # Returns
    /// * Number of transactions in the window
    ///
    /// # Errors
    /// Returns an error if Redis operation fails
    async fn get_velocity_counter(
        &self,
        user_id: &str,
        window_seconds: u64,
    ) -> anyhow::Result<u64>;

    /// Increment velocity counter for a user
    ///
    /// # Arguments
    /// * `user_id` - User identifier
    /// * `window_seconds` - Time window in seconds
    ///
    /// # Errors
    /// Returns an error if Redis operation fails
    async fn increment_velocity_counter(
        &self,
        user_id: &str,
        window_seconds: u64,
    ) -> anyhow::Result<()>;

    /// Check if a user/IP/device is blacklisted
    ///
    /// # Arguments
    /// * `key` - Identifier to check (user_id, ip_address, etc.)
    /// * `list_name` - Name of the blacklist
    ///
    /// # Returns
    /// * true if blacklisted, false otherwise
    ///
    /// # Errors
    /// Returns an error if Redis operation fails
    async fn check_blacklist(&self, key: &str, list_name: &str) -> anyhow::Result<bool>;

    /// Add an entry to a blacklist
    ///
    /// # Arguments
    /// * `key` - Identifier to blacklist
    /// * `list_name` - Name of the blacklist
    /// * `ttl_seconds` - Time-to-live in seconds (None for permanent)
    ///
    /// # Errors
    /// Returns an error if Redis operation fails
    async fn add_to_blacklist(
        &self,
        key: &str,
        list_name: &str,
        ttl_seconds: Option<u64>,
    ) -> anyhow::Result<()>;

    /// Get user features for inference
    ///
    /// # Arguments
    /// * `user_id` - User identifier
    ///
    /// # Returns
    /// * HashMap of feature names to values
    ///
    /// # Errors
    /// Returns an error if Redis operation fails
    async fn get_user_features(&self, user_id: &str) -> anyhow::Result<HashMap<String, f64>>;
}

#[cfg(test)]
mod tests {
    use super::*;

    // Mock implementation for testing
    struct MockInferenceProvider {
        model_version: String,
    }

    #[async_trait]
    impl InferenceProvider for MockInferenceProvider {
        async fn infer(&self, _transaction: &Transaction) -> anyhow::Result<InferenceResult> {
            todo!("Implement inference logic")
        }

        async fn load_model(&mut self, _model_metadata: &ModelMetadata) -> anyhow::Result<()> {
            todo!("Implement model loading")
        }

        fn get_model_version(&self) -> String {
            self.model_version.clone()
        }
    }

    struct MockStorageProvider;

    #[async_trait]
    impl StorageProvider for MockStorageProvider {
        async fn load_model(&self, _path: &str) -> anyhow::Result<Vec<u8>> {
            todo!("Implement model loading from storage")
        }

        async fn save_model(&self, _path: &str, _data: &[u8]) -> anyhow::Result<()> {
            todo!("Implement model saving to storage")
        }

        async fn list_models(&self, _prefix: &str) -> anyhow::Result<Vec<String>> {
            todo!("Implement model listing")
        }

        async fn get_model_metadata(&self, _path: &str) -> anyhow::Result<ModelMetadata> {
            todo!("Implement metadata retrieval")
        }
    }

    struct MockStateProvider;

    #[async_trait]
    impl StateProvider for MockStateProvider {
        async fn get_velocity_counter(
            &self,
            _user_id: &str,
            _window_seconds: u64,
        ) -> anyhow::Result<u64> {
            todo!("Implement velocity counter retrieval")
        }

        async fn increment_velocity_counter(
            &self,
            _user_id: &str,
            _window_seconds: u64,
        ) -> anyhow::Result<()> {
            todo!("Implement velocity counter increment")
        }

        async fn check_blacklist(&self, _key: &str, _list_name: &str) -> anyhow::Result<bool> {
            todo!("Implement blacklist check")
        }

        async fn add_to_blacklist(
            &self,
            _key: &str,
            _list_name: &str,
            _ttl_seconds: Option<u64>,
        ) -> anyhow::Result<()> {
            todo!("Implement blacklist addition")
        }

        async fn get_user_features(&self, _user_id: &str) -> anyhow::Result<HashMap<String, f64>> {
            todo!("Implement user features retrieval")
        }
    }

    #[tokio::test]
    #[should_panic(expected = "not yet implemented")]
    async fn test_inference_provider_should_return_high_fraud_score() {
        let provider = MockInferenceProvider {
            model_version: "v1.0.0".to_string(),
        };

        let transaction = Transaction {
            transaction_id: "txn_suspicious".to_string(),
            user_id: "user_123".to_string(),
            amount: 1000000, // $10,000 - suspicious amount
            currency: "USD".to_string(),
            merchant_id: "merchant_999".to_string(),
            timestamp: 1234567890,
            ip_address: "192.168.1.1".to_string(),
            device_id: None,
            metadata: HashMap::new(),
        };

        let result = provider.infer(&transaction).await.unwrap();
        
        // This should fail because the implementation uses todo!()
        assert!(result.fraud_score > 0.8);
        assert_eq!(result.decision, Decision::Block);
    }

    #[tokio::test]
    #[should_panic(expected = "not yet implemented")]
    async fn test_storage_provider_should_load_model() {
        let provider = MockStorageProvider;
        
        let model_data = provider.load_model("s3://models/fraud_v1.bin").await.unwrap();
        
        // This should fail because the implementation uses todo!()
        assert!(!model_data.is_empty());
    }

    #[tokio::test]
    #[should_panic(expected = "not yet implemented")]
    async fn test_state_provider_should_check_blacklist() {
        let provider = MockStateProvider;
        
        let is_blacklisted = provider
            .check_blacklist("user_123", "fraud_users")
            .await
            .unwrap();
        
        // This should fail because the implementation uses todo!()
        assert!(is_blacklisted);
    }

    #[tokio::test]
    #[should_panic(expected = "not yet implemented")]
    async fn test_state_provider_should_get_velocity_counter() {
        let provider = MockStateProvider;
        
        let count = provider
            .get_velocity_counter("user_123", 3600)
            .await
            .unwrap();
        
        // This should fail because the implementation uses todo!()
        assert!(count > 0);
    }

    #[test]
    fn test_inference_provider_get_model_version() {
        let provider = MockInferenceProvider {
            model_version: "v2.1.0".to_string(),
        };
        
        assert_eq!(provider.get_model_version(), "v2.1.0");
    }
}
