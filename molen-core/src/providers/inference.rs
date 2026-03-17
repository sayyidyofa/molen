//! Inference provider implementation for fraud detection ML
//!
//! This module provides fraud detection inference using a rule-based algorithm.
//! The architecture supports future integration with XGBoost or other ML models.

use crate::traits::InferenceProvider;
use crate::types::{Decision, InferenceResult, ModelMetadata, Transaction};
use anyhow::Result;
use async_trait::async_trait;
use std::collections::HashMap;

/// Real inference provider using rule-based fraud scoring
///
/// This implementation uses a sophisticated rule-based algorithm that
/// can be replaced with XGBoost or other ML models in the future.
pub struct RealInferenceProvider {
    model_version: String,
    model_metadata: Option<ModelMetadata>,
}

impl RealInferenceProvider {
    /// Create a new RealInferenceProvider
    pub fn new() -> Self {
        Self {
            model_version: "rules-v1.0".to_string(),
            model_metadata: None,
        }
    }
    
    /// Extract features from transaction
    fn extract_features(&self, transaction: &Transaction) -> HashMap<String, f64> {
        let mut features = HashMap::new();
        
        // Amount feature (convert from cents to dollars)
        features.insert("amount".to_string(), transaction.amount as f64 / 100.0);
        
        // Hour of day feature (extract from timestamp in milliseconds)
        let seconds = transaction.timestamp / 1000;
        let hour = (seconds / 3600) % 24;
        features.insert("hour_of_day".to_string(), hour as f64);
        
        // Placeholder for velocity (would come from StateProvider in real orchestrator)
        features.insert("velocity_count".to_string(), 0.0);
        
        // Merchant category (simplified - would use real categorization)
        features.insert("merchant_risk".to_string(), 0.2);
        
        features
    }
    
    /// Calculate fraud score based on features
    fn calculate_fraud_score(&self, features: &HashMap<String, f64>) -> f64 {
        let amount = features.get("amount").unwrap_or(&0.0);
        let hour = features.get("hour_of_day").unwrap_or(&12.0);
        let velocity = features.get("velocity_count").unwrap_or(&0.0);
        let merchant_risk = features.get("merchant_risk").unwrap_or(&0.0);
        
        // Amount risk scoring (more aggressive)
        let amount_risk = if *amount < 100.0 {
            0.0
        } else if *amount < 500.0 {
            0.2
        } else if *amount < 1000.0 {
            0.35
        } else if *amount < 5000.0 {
            0.55
        } else if *amount < 10000.0 {
            0.75
        } else {
            1.0  // Very high amount = maximum risk
        };
        
        // Time of day risk (late night = higher risk)
        let time_risk = if *hour >= 23.0 || *hour < 6.0 {
            0.5  // Late night/early morning
        } else if *hour >= 21.0 || *hour < 8.0 {
            0.3  // Evening/early morning
        } else {
            0.0
        };
        
        // Velocity risk
        let velocity_risk = if *velocity < 5.0 {
            0.0
        } else if *velocity < 10.0 {
            0.3
        } else if *velocity < 20.0 {
            0.6
        } else {
            0.9
        };
        
        // Weighted combination - emphasize amount more
        let score = amount_risk * 0.50 + time_risk * 0.20 + velocity_risk * 0.20 + merchant_risk * 0.10;
        
        // Clamp to [0, 1]
        score.max(0.0).min(1.0)
    }
    
    /// Determine decision based on score
    fn determine_decision(&self, score: f64) -> Decision {
        if score < 0.3 {
            Decision::Pass
        } else if score < 0.7 {
            Decision::Flag
        } else {
            Decision::Block
        }
    }
    
    /// Generate triggered rules based on features
    fn generate_triggered_rules(&self, score: f64, features: &HashMap<String, f64>) -> Vec<String> {
        let mut rules = Vec::new();
        let amount = features.get("amount").unwrap_or(&0.0);
        let velocity = features.get("velocity_count").unwrap_or(&0.0);
        let hour = features.get("hour_of_day").unwrap_or(&12.0);
        
        if *amount > 10000.0 {
            rules.push("high_amount".to_string());
        }
        if *velocity > 15.0 {
            rules.push("high_velocity".to_string());
        }
        if *hour >= 23.0 || *hour < 6.0 {
            rules.push("late_night_transaction".to_string());
        }
        if score > 0.7 {
            rules.push("high_fraud_score".to_string());
        }
        
        rules
    }
}

impl Default for RealInferenceProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl InferenceProvider for RealInferenceProvider {
    async fn infer(&self, transaction: &Transaction) -> Result<InferenceResult> {
        let start = std::time::Instant::now();
        
        // Extract features
        let features = self.extract_features(transaction);
        
        // Calculate fraud score
        let fraud_score = self.calculate_fraud_score(&features);
        
        // Determine decision
        let decision = self.determine_decision(fraud_score);
        
        // Generate triggered rules
        let triggered_rules = self.generate_triggered_rules(fraud_score, &features);
        
        let latency_ms = start.elapsed().as_millis() as u64;
        
        Ok(InferenceResult {
            transaction_id: transaction.transaction_id.clone(),
            decision,
            fraud_score,
            model_version: self.model_version.clone(),
            latency_ms,
            features,
            triggered_rules,
        })
    }
    
    async fn load_model(&mut self, model_metadata: &ModelMetadata) -> Result<()> {
        // In a real implementation, this would:
        // 1. Download model from S3 via StorageProvider
        // 2. Load into XGBoost predictor
        // 3. Cache the model
        
        self.model_metadata = Some(model_metadata.clone());
        self.model_version = model_metadata.version.clone();
        Ok(())
    }
    
    fn get_model_version(&self) -> String {
        self.model_version.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    fn create_test_transaction(amount_cents: i64, timestamp_ms: i64) -> Transaction {
        Transaction {
            transaction_id: "txn_test".to_string(),
            user_id: "user_test".to_string(),
            amount: amount_cents,
            currency: "USD".to_string(),
            merchant_id: "merchant_test".to_string(),
            timestamp: timestamp_ms,
            ip_address: "192.168.1.1".to_string(),
            device_id: Some("device_test".to_string()),
            metadata: HashMap::new(),
        }
    }
    
    #[tokio::test]
    async fn test_inference_low_risk_transaction() {
        let provider = RealInferenceProvider::new();
        // $50, noon (43200000ms = 12 hours in ms)
        let transaction = create_test_transaction(5000, 43200000);
        
        let result = provider.infer(&transaction).await.unwrap();
        
        assert_eq!(result.decision, Decision::Pass);
        assert!(result.fraud_score < 0.3);
        assert_eq!(result.model_version, "rules-v1.0");
    }
    
    #[tokio::test]
    async fn test_inference_high_risk_transaction() {
        let provider = RealInferenceProvider::new();
        // $15k, 1am (3600000ms = 1 hour in ms)
        let transaction = create_test_transaction(1500000, 3600000);
        
        let result = provider.infer(&transaction).await.unwrap();
        
        assert_eq!(result.decision, Decision::Block);
        assert!(result.fraud_score > 0.7);
    }
    
    #[tokio::test]
    async fn test_inference_medium_risk_transaction() {
        let provider = RealInferenceProvider::new();
        // $500, 10pm (79200000ms = 22 hours in ms)
        let transaction = create_test_transaction(50000, 79200000);
        
        let result = provider.infer(&transaction).await.unwrap();
        
        assert!(result.fraud_score >= 0.3 && result.fraud_score <= 0.7);
    }
    
    #[test]
    fn test_inference_extract_features() {
        let provider = RealInferenceProvider::new();
        let transaction = create_test_transaction(10000, 43200000);
        
        let features = provider.extract_features(&transaction);
        
        assert_eq!(features.get("amount"), Some(&100.0));
        assert!(features.contains_key("hour_of_day"));
    }
}
