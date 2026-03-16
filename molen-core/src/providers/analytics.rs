//! Analytics provider implementation for Elasticsearch
//!
//! This module provides Elasticsearch integration for storing and querying
//! fraud detection decisions for long-term analytics and triage.

use crate::traits::{AlertQuery, AnalyticsProvider};
use crate::types::{InferenceResult, Decision};
use anyhow::{Context, Result};
use async_trait::async_trait;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;

/// Configuration for Elasticsearch connection
#[derive(Debug, Clone)]
pub struct AnalyticsConfig {
    /// Elasticsearch base URL
    pub base_url: String,
    
    /// Username for basic auth (optional)
    pub username: Option<String>,
    
    /// Password for basic auth (optional)
    pub password: Option<String>,
    
    /// Index name for decisions
    pub decisions_index: String,
    
    /// Index name for alerts
    pub alerts_index: String,
}

impl Default for AnalyticsConfig {
    fn default() -> Self {
        Self {
            base_url: std::env::var("ES_URL").unwrap_or_else(|_| "http://localhost:9200".to_string()),
            username: std::env::var("ES_USERNAME").ok(),
            password: std::env::var("ES_PASSWORD").ok(),
            decisions_index: std::env::var("ES_DECISIONS_INDEX")
                .unwrap_or_else(|_| "fraud-decisions".to_string()),
            alerts_index: std::env::var("ES_ALERTS_INDEX")
                .unwrap_or_else(|_| "fraud-alerts".to_string()),
        }
    }
}

impl AnalyticsConfig {
    /// Create from environment variables
    pub fn from_env() -> Self {
        Self::default()
    }
}

/// Elasticsearch response wrapper
#[derive(Debug, Deserialize)]
struct EsResponse<T> {
    hits: EsHits<T>,
}

#[derive(Debug, Deserialize)]
struct EsHits<T> {
    hits: Vec<EsHit<T>>,
}

#[derive(Debug, Deserialize)]
struct EsHit<T> {
    #[serde(rename = "_source")]
    source: T,
}

/// Real Elasticsearch analytics provider
pub struct RealAnalyticsProvider {
    client: Client,
    config: AnalyticsConfig,
}

impl RealAnalyticsProvider {
    /// Create a new RealAnalyticsProvider
    pub fn new(config: AnalyticsConfig) -> Result<Self> {
        let client = Client::builder()
            .build()
            .context("Failed to create HTTP client")?;
        
        Ok(Self { client, config })
    }
    
    fn build_url(&self, index: &str, path: &str) -> String {
        format!("{}/{}/{}", self.config.base_url, index, path)
    }
    
    fn build_request(&self, builder: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        // Add basic auth if provided
        if let (Some(ref username), Some(ref password)) = (&self.config.username, &self.config.password) {
            builder.basic_auth(username, Some(password))
        } else {
            builder
        }
    }
}

#[async_trait]
impl AnalyticsProvider for RealAnalyticsProvider {
    async fn index_decision(&self, result: &InferenceResult) -> Result<()> {
        let url = self.build_url(&self.config.decisions_index, "_doc");
        
        let builder = self.client.post(&url).json(result);
        let response = self.build_request(builder)
            .send()
            .await
            .context("Failed to send index request to Elasticsearch")?;
        
        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            anyhow::bail!("Elasticsearch indexing failed with status {}: {}", status, body);
        }
        
        Ok(())
    }
    
    async fn query_alerts(&self, query: &AlertQuery) -> Result<Vec<InferenceResult>> {
        let url = self.build_url(&self.config.alerts_index, "_search");
        
        // Build Elasticsearch query
        let mut must_clauses: Vec<serde_json::Value> = vec![
            json!({
                "range": {
                    "timestamp": {
                        "gte": query.start_time,
                        "lte": query.end_time
                    }
                }
            })
        ];
        
        if let Some(ref decision) = query.decision {
            let decision_str = match decision {
                Decision::Pass => "PASS",
                Decision::Flag => "FLAG",
                Decision::Block => "BLOCK",
            };
            must_clauses.push(json!({
                "term": {
                    "decision": decision_str
                }
            }));
        }
        
        if let Some(ref user_id) = query.user_id {
            must_clauses.push(json!({
                "term": {
                    "user_id": user_id
                }
            }));
        }
        
        let es_query = json!({
            "query": {
                "bool": {
                    "must": must_clauses
                }
            },
            "size": query.limit
        });
        
        let builder = self.client.post(&url).json(&es_query);
        let response = self.build_request(builder)
            .send()
            .await
            .context("Failed to query Elasticsearch")?;
        
        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            anyhow::bail!("Elasticsearch query failed with status {}: {}", status, body);
        }
        
        let es_response: EsResponse<InferenceResult> = response
            .json()
            .await
            .context("Failed to parse Elasticsearch response")?;
        
        Ok(es_response.hits.hits.into_iter().map(|hit| hit.source).collect())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_analytics_config_default() {
        let config = AnalyticsConfig::default();
        assert!(!config.base_url.is_empty());
        assert_eq!(config.decisions_index, "fraud-decisions");
        assert_eq!(config.alerts_index, "fraud-alerts");
    }
    
    #[test]
    fn test_analytics_config_from_env() {
        let config = AnalyticsConfig::from_env();
        assert!(!config.base_url.is_empty());
    }
    
    #[test]
    fn test_analytics_build_url() {
        let config = AnalyticsConfig {
            base_url: "http://localhost:9200".to_string(),
            username: None,
            password: None,
            decisions_index: "test-index".to_string(),
            alerts_index: "test-alerts".to_string(),
        };
        
        let provider = RealAnalyticsProvider::new(config).unwrap();
        let url = provider.build_url("myindex", "_doc");
        assert_eq!(url, "http://localhost:9200/myindex/_doc");
    }
}
