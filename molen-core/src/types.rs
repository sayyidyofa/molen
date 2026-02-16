//! Core data structures for the Molen platform

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a financial transaction to be evaluated for fraud
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    /// Unique transaction identifier
    pub transaction_id: String,
    
    /// User ID associated with the transaction
    pub user_id: String,
    
    /// Transaction amount in cents
    pub amount: i64,
    
    /// Currency code (e.g., "USD", "EUR")
    pub currency: String,
    
    /// Merchant identifier
    pub merchant_id: String,
    
    /// Transaction timestamp (Unix epoch milliseconds)
    pub timestamp: i64,
    
    /// IP address of the transaction origin
    pub ip_address: String,
    
    /// Device fingerprint
    pub device_id: Option<String>,
    
    /// Additional metadata as key-value pairs
    pub metadata: HashMap<String, String>,
}

/// The fraud detection decision for a transaction
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Decision {
    /// Transaction passes all fraud checks
    Pass,
    
    /// Transaction flagged for manual review
    Flag,
    
    /// Transaction blocked automatically
    Block,
}

/// Result of running inference on a transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceResult {
    /// The transaction that was evaluated
    pub transaction_id: String,
    
    /// Fraud probability score (0.0 to 1.0)
    pub fraud_score: f64,
    
    /// Final decision based on the score and rules
    pub decision: Decision,
    
    /// Model version used for inference
    pub model_version: String,
    
    /// Inference latency in milliseconds
    pub latency_ms: u64,
    
    /// Additional features used in the model
    pub features: HashMap<String, f64>,
    
    /// Rule IDs that triggered (if any)
    pub triggered_rules: Vec<String>,
}

/// Metadata about a fraud detection model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelMetadata {
    /// Unique model identifier
    pub model_id: String,
    
    /// Model version string
    pub version: String,
    
    /// Model type (e.g., "xgboost", "lightgbm", "neural_net")
    pub model_type: String,
    
    /// S3/Garage path to the model weights
    pub weights_path: String,
    
    /// Timestamp when the model was trained
    pub trained_at: i64,
    
    /// Model accuracy metrics
    pub accuracy: f64,
    
    /// False positive rate
    pub false_positive_rate: f64,
    
    /// False negative rate
    pub false_negative_rate: f64,
    
    /// Whether this is the currently active "live" model
    pub is_live: bool,
    
    /// Additional metadata
    pub metadata: HashMap<String, String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transaction_serialization() {
        let transaction = Transaction {
            transaction_id: "txn_123".to_string(),
            user_id: "user_456".to_string(),
            amount: 10000,
            currency: "USD".to_string(),
            merchant_id: "merchant_789".to_string(),
            timestamp: 1234567890,
            ip_address: "192.168.1.1".to_string(),
            device_id: Some("device_abc".to_string()),
            metadata: HashMap::new(),
        };

        let json = serde_json::to_string(&transaction).unwrap();
        let deserialized: Transaction = serde_json::from_str(&json).unwrap();
        
        assert_eq!(transaction.transaction_id, deserialized.transaction_id);
        assert_eq!(transaction.amount, deserialized.amount);
    }

    #[test]
    fn test_decision_enum() {
        assert_eq!(Decision::Pass, Decision::Pass);
        assert_ne!(Decision::Pass, Decision::Block);
        
        // Test serialization
        let json = serde_json::to_string(&Decision::Flag).unwrap();
        assert!(json.contains("FLAG"));
    }

    #[test]
    fn test_inference_result_creation() {
        let result = InferenceResult {
            transaction_id: "txn_123".to_string(),
            fraud_score: 0.85,
            decision: Decision::Block,
            model_version: "v1.0.0".to_string(),
            latency_ms: 25,
            features: HashMap::new(),
            triggered_rules: vec!["rule_high_amount".to_string()],
        };

        assert_eq!(result.decision, Decision::Block);
        assert!(result.fraud_score > 0.8);
    }

    #[test]
    fn test_model_metadata_serialization() {
        let metadata = ModelMetadata {
            model_id: "model_123".to_string(),
            version: "v2.1.0".to_string(),
            model_type: "xgboost".to_string(),
            weights_path: "s3://models/fraud_v2.bin".to_string(),
            trained_at: 1234567890,
            accuracy: 0.95,
            false_positive_rate: 0.02,
            false_negative_rate: 0.03,
            is_live: true,
            metadata: HashMap::new(),
        };

        let json = serde_json::to_string(&metadata).unwrap();
        let deserialized: ModelMetadata = serde_json::from_str(&json).unwrap();
        
        assert_eq!(metadata.model_id, deserialized.model_id);
        assert_eq!(metadata.is_live, deserialized.is_live);
    }
}
