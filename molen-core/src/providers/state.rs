//! Redis-based state provider implementation
//!
//! Provides stateful operations for fraud detection including:
//! - Velocity counters (time-windowed transaction counts)
//! - Blacklists (user/IP/device blocking)
//! - Feature caching (user profile data)

use crate::traits::StateProvider;
use anyhow::{Context, Result};
use async_trait::async_trait;
use fred::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

/// Configuration for Redis connection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateConfig {
    /// Redis connection URL (e.g., "redis://localhost:6379")
    pub redis_url: String,
    
    /// Connection pool size
    pub pool_size: usize,
    
    /// Default key prefix for all operations
    pub key_prefix: String,
}

impl Default for StateConfig {
    fn default() -> Self {
        Self {
            redis_url: "redis://localhost:6379".to_string(),
            pool_size: 10,
            key_prefix: "molen:".to_string(),
        }
    }
}

impl StateConfig {
    /// Create configuration from environment variables
    ///
    /// Environment variables:
    /// - REDIS_URL: Redis connection URL
    /// - REDIS_POOL_SIZE: Connection pool size (default: 10)
    /// - REDIS_KEY_PREFIX: Key prefix (default: "molen:")
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            redis_url: std::env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            pool_size: std::env::var("REDIS_POOL_SIZE")
                .unwrap_or_else(|_| "10".to_string())
                .parse()
                .context("Invalid REDIS_POOL_SIZE")?,
            key_prefix: std::env::var("REDIS_KEY_PREFIX")
                .unwrap_or_else(|_| "molen:".to_string()),
        })
    }
}

/// Real Redis state provider using fred client
pub struct RealStateProvider {
    client: RedisClient,
    config: StateConfig,
}

impl RealStateProvider {
    /// Create a new Redis state provider
    ///
    /// # Arguments
    /// * `config` - Redis configuration
    ///
    /// # Errors
    /// Returns an error if connection fails
    pub async fn new(config: StateConfig) -> Result<Self> {
        // Parse Redis URL
        let redis_config = RedisConfig::from_url(&config.redis_url)
            .context("Failed to parse Redis URL")?;
        
        // Create connection pool config
        let pool_config = Builder::from_config(redis_config)
            .with_connection_config(|c| {
                c.max_command_attempts = 3;
                c.connection_timeout = std::time::Duration::from_secs(5);
            })
            .build_pool(config.pool_size)
            .context("Failed to create connection pool")?;
        
        // Initialize client
        let client = pool_config.next();
        
        // Connect to Redis
        client.connect();
        client.wait_for_connect()
            .await
            .context("Failed to connect to Redis")?;
        
        Ok(Self { 
            client: client.clone(), 
            config 
        })
    }
    
    /// Build a prefixed key
    fn prefixed_key(&self, key: &str) -> String {
        format!("{}{}", self.config.key_prefix, key)
    }
    
    /// Build a velocity counter key
    fn velocity_key(&self, user_id: &str, window_seconds: u64) -> String {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs();
        let window_start = (now / window_seconds) * window_seconds;
        
        self.prefixed_key(&format!("velocity:{}:{}", user_id, window_start))
    }
    
    /// Build a blacklist key
    fn blacklist_key(&self, list_name: &str) -> String {
        self.prefixed_key(&format!("blacklist:{}", list_name))
    }
    
    /// Build a user features key
    fn features_key(&self, user_id: &str) -> String {
        self.prefixed_key(&format!("features:{}", user_id))
    }
}

#[async_trait]
impl StateProvider for RealStateProvider {
    async fn get_velocity_counter(
        &self,
        user_id: &str,
        window_seconds: u64,
    ) -> Result<u64> {
        let key = self.velocity_key(user_id, window_seconds);
        
        // Get counter value, default to 0 if not exists
        let count: Option<u64> = self.client
            .get(&key)
            .await
            .context("Failed to get velocity counter")?;
        
        Ok(count.unwrap_or(0))
    }
    
    async fn increment_velocity_counter(
        &self,
        user_id: &str,
        window_seconds: u64,
    ) -> Result<()> {
        let key = self.velocity_key(user_id, window_seconds);
        
        // Increment counter
        self.client
            .incr::<(), _>(&key)
            .await
            .context("Failed to increment velocity counter")?;
        
        // Set TTL to window duration + buffer (to handle clock skew)
        let ttl = (window_seconds * 2) as i64;
        self.client
            .expire::<(), _>(&key, ttl)
            .await
            .context("Failed to set TTL on velocity counter")?;
        
        Ok(())
    }
    
    async fn check_blacklist(&self, key: &str, list_name: &str) -> Result<bool> {
        let blacklist_key = self.blacklist_key(list_name);
        
        // Check if member exists in set
        let is_member: bool = self.client
            .sismember(&blacklist_key, key)
            .await
            .context("Failed to check blacklist")?;
        
        Ok(is_member)
    }
    
    async fn add_to_blacklist(
        &self,
        key: &str,
        list_name: &str,
        ttl_seconds: Option<u64>,
    ) -> Result<()> {
        let blacklist_key = self.blacklist_key(list_name);
        
        // Add to set
        self.client
            .sadd::<(), _, _>(&blacklist_key, key)
            .await
            .context("Failed to add to blacklist")?;
        
        // Set TTL if specified
        if let Some(ttl) = ttl_seconds {
            self.client
                .expire::<(), _>(&blacklist_key, ttl as i64)
                .await
                .context("Failed to set TTL on blacklist")?;
        }
        
        Ok(())
    }
    
    async fn get_user_features(&self, user_id: &str) -> Result<HashMap<String, f64>> {
        let key = self.features_key(user_id);
        
        // Get all hash fields
        let features: HashMap<String, String> = self.client
            .hgetall(&key)
            .await
            .context("Failed to get user features")?;
        
        // Convert string values to f64
        let mut result = HashMap::new();
        for (field, value) in features {
            if let Ok(num) = value.parse::<f64>() {
                result.insert(field, num);
            }
        }
        
        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_state_config_default() {
        let config = StateConfig::default();
        assert_eq!(config.redis_url, "redis://localhost:6379");
        assert_eq!(config.pool_size, 10);
        assert_eq!(config.key_prefix, "molen:");
    }
    
    #[test]
    fn test_state_config_from_env() {
        std::env::set_var("REDIS_URL", "redis://test:6379");
        std::env::set_var("REDIS_POOL_SIZE", "5");
        std::env::set_var("REDIS_KEY_PREFIX", "test:");
        
        let config = StateConfig::from_env().unwrap();
        assert_eq!(config.redis_url, "redis://test:6379");
        assert_eq!(config.pool_size, 5);
        assert_eq!(config.key_prefix, "test:");
        
        // Cleanup
        std::env::remove_var("REDIS_URL");
        std::env::remove_var("REDIS_POOL_SIZE");
        std::env::remove_var("REDIS_KEY_PREFIX");
    }
    
    #[test]
    fn test_prefixed_key() {
        let config = StateConfig {
            redis_url: "redis://localhost:6379".to_string(),
            pool_size: 10,
            key_prefix: "test:".to_string(),
        };
        
        // Can't test RealStateProvider without Redis connection
        // This is a placeholder for the key structure
        let prefix = &config.key_prefix;
        assert_eq!(format!("{}velocity:user123:1234567890", prefix), "test:velocity:user123:1234567890");
    }
}
