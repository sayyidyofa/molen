//! S3/MinIO Storage Provider Implementation
//!
//! This module provides a real implementation of the StorageProvider trait
//! using AWS SDK for S3-compatible object storage.

use crate::{ModelMetadata, StorageProvider};
use anyhow::{Context, Result};
use async_trait::async_trait;
use aws_config::Region;
use aws_sdk_s3::{
    config::{Credentials, SharedCredentialsProvider},
    primitives::ByteStream,
    Client as S3Client,
};

/// Configuration for S3/MinIO storage
#[derive(Debug, Clone)]
pub struct StorageConfig {
    /// S3/MinIO endpoint URL
    pub endpoint: String,
    
    /// Access key ID
    pub access_key: String,
    
    /// Secret access key
    pub secret_key: String,
    
    /// Bucket name
    pub bucket: String,
    
    /// Region (optional, defaults to "us-east-1")
    pub region: Option<String>,
}

/// Real implementation of StorageProvider using AWS SDK S3
pub struct RealStorageProvider {
    client: S3Client,
    bucket: String,
}

impl RealStorageProvider {
    /// Create a new RealStorageProvider with the given configuration
    ///
    /// # Arguments
    /// * `config` - Storage configuration
    ///
    /// # Returns
    /// * New RealStorageProvider instance
    pub async fn new(config: StorageConfig) -> Result<Self> {
        // Create credentials
        let credentials = Credentials::new(
            config.access_key.clone(),
            config.secret_key.clone(),
            None, // session token
            None, // expiration
            "molen-storage",
        );

        let credentials_provider = SharedCredentialsProvider::new(credentials);

        // Configure region
        let region = Region::new(config.region.unwrap_or_else(|| "us-east-1".to_string()));

        // Build S3 config with behavior version
        let s3_config = aws_sdk_s3::config::Builder::new()
            .behavior_version_latest()
            .region(region)
            .credentials_provider(credentials_provider)
            .endpoint_url(&config.endpoint)
            .force_path_style(true) // Required for MinIO/Garage
            .build();

        let client = S3Client::from_conf(s3_config);

        Ok(Self {
            client,
            bucket: config.bucket,
        })
    }

    /// Create from environment variables
    ///
    /// Expected environment variables:
    /// - S3_ENDPOINT
    /// - S3_ACCESS_KEY
    /// - S3_SECRET_KEY
    /// - S3_BUCKET
    /// - S3_REGION (optional)
    pub async fn from_env() -> Result<Self> {
        let config = StorageConfig {
            endpoint: std::env::var("S3_ENDPOINT")
                .context("S3_ENDPOINT environment variable not set")?,
            access_key: std::env::var("S3_ACCESS_KEY")
                .context("S3_ACCESS_KEY environment variable not set")?,
            secret_key: std::env::var("S3_SECRET_KEY")
                .context("S3_SECRET_KEY environment variable not set")?,
            bucket: std::env::var("S3_BUCKET")
                .context("S3_BUCKET environment variable not set")?,
            region: std::env::var("S3_REGION").ok(),
        };

        Self::new(config).await
    }
}

#[async_trait]
impl StorageProvider for RealStorageProvider {
    async fn load_model(&self, path: &str) -> Result<Vec<u8>> {
        let response = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(path)
            .send()
            .await
            .context(format!("Failed to load model from S3: {}", path))?;

        let bytes = response
            .body
            .collect()
            .await
            .context("Failed to read model bytes from S3")?
            .into_bytes();

        Ok(bytes.to_vec())
    }

    async fn save_model(&self, path: &str, data: &[u8]) -> Result<()> {
        let byte_stream = ByteStream::from(data.to_vec());

        self.client
            .put_object()
            .bucket(&self.bucket)
            .key(path)
            .body(byte_stream)
            .send()
            .await
            .context(format!("Failed to save model to S3: {}", path))?;

        Ok(())
    }

    async fn list_models(&self, prefix: &str) -> Result<Vec<String>> {
        let response = self
            .client
            .list_objects_v2()
            .bucket(&self.bucket)
            .prefix(prefix)
            .send()
            .await
            .context(format!("Failed to list models with prefix: {}", prefix))?;

        let keys = response
            .contents()
            .iter()
            .filter_map(|obj| obj.key())
            .map(|s| s.to_string())
            .collect();

        Ok(keys)
    }

    async fn get_model_metadata(&self, path: &str) -> Result<ModelMetadata> {
        // Load the model metadata from a JSON file in S3
        // Convention: metadata is stored at path + ".metadata.json"
        let metadata_path = format!("{}.metadata.json", path);

        let response = self
            .client
            .get_object()
            .bucket(&self.bucket)
            .key(&metadata_path)
            .send()
            .await
            .context(format!(
                "Failed to load model metadata from S3: {}",
                metadata_path
            ))?;

        let bytes = response
            .body
            .collect()
            .await
            .context("Failed to read metadata bytes from S3")?
            .into_bytes();

        let metadata: ModelMetadata = serde_json::from_slice(&bytes)
            .context("Failed to parse model metadata JSON")?;

        Ok(metadata)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_storage_config_creation() {
        let config = StorageConfig {
            endpoint: "http://localhost:9000".to_string(),
            access_key: "minioadmin".to_string(),
            secret_key: "minioadmin".to_string(),
            bucket: "molen-models".to_string(),
            region: Some("us-east-1".to_string()),
        };

        assert_eq!(config.endpoint, "http://localhost:9000");
        assert_eq!(config.bucket, "molen-models");
    }

    #[tokio::test]
    async fn test_real_storage_provider_creation() {
        let config = StorageConfig {
            endpoint: "http://localhost:9000".to_string(),
            access_key: "minioadmin".to_string(),
            secret_key: "minioadmin".to_string(),
            bucket: "test-bucket".to_string(),
            region: Some("us-east-1".to_string()),
        };

        let result = RealStorageProvider::new(config).await;
        assert!(result.is_ok(), "Should create provider successfully");
    }

    // Integration tests with real S3/MinIO would go here
    // These would use testcontainers to spin up MinIO
}
