use crate::traits::{Alert, EventStreamProvider};
use crate::types::Transaction;
use anyhow::{Context, Result};
use async_trait::async_trait;
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::producer::{FutureProducer, FutureRecord};
use rdkafka::Message;
use std::time::Duration;

/// Configuration for Kafka/Redpanda event streaming
#[derive(Debug, Clone)]
pub struct EventStreamConfig {
    /// Comma-separated list of Kafka brokers
    pub brokers: String,
    /// Consumer group ID for scaling
    pub consumer_group_id: String,
    /// Input topic for transaction events
    pub input_topic: String,
    /// Output topic for fraud alerts
    pub output_topic: String,
    /// Batch size for consumption
    pub batch_size: usize,
    /// Batch timeout in milliseconds
    pub batch_timeout_ms: u64,
}

impl Default for EventStreamConfig {
    fn default() -> Self {
        Self {
            brokers: "localhost:9092".to_string(),
            consumer_group_id: "molen-worker".to_string(),
            input_topic: "user-events".to_string(),
            output_topic: "fraud-alerts".to_string(),
            batch_size: 100,
            batch_timeout_ms: 1000,
        }
    }
}

impl EventStreamConfig {
    /// Create configuration from environment variables
    pub fn from_env() -> Self {
        Self {
            brokers: std::env::var("KAFKA_BROKERS")
                .unwrap_or_else(|_| "localhost:9092".to_string()),
            consumer_group_id: std::env::var("KAFKA_CONSUMER_GROUP")
                .unwrap_or_else(|_| "molen-worker".to_string()),
            input_topic: std::env::var("KAFKA_INPUT_TOPIC")
                .unwrap_or_else(|_| "user-events".to_string()),
            output_topic: std::env::var("KAFKA_OUTPUT_TOPIC")
                .unwrap_or_else(|_| "fraud-alerts".to_string()),
            batch_size: std::env::var("KAFKA_BATCH_SIZE")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(100),
            batch_timeout_ms: std::env::var("KAFKA_BATCH_TIMEOUT_MS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(1000),
        }
    }
}

/// Real implementation of EventStreamProvider using rdkafka
pub struct RealEventStreamProvider {
    consumer: StreamConsumer,
    producer: FutureProducer,
    config: EventStreamConfig,
}

impl RealEventStreamProvider {
    /// Create a new Kafka/Redpanda event stream provider
    pub async fn new(config: EventStreamConfig) -> Result<Self> {
        // Create consumer
        let consumer: StreamConsumer = ClientConfig::new()
            .set("bootstrap.servers", &config.brokers)
            .set("group.id", &config.consumer_group_id)
            .set("enable.auto.commit", "true")
            .set("auto.offset.reset", "earliest")
            .set("session.timeout.ms", "6000")
            .create()
            .context("Failed to create Kafka consumer")?;

        // Subscribe to input topic
        consumer
            .subscribe(&[&config.input_topic])
            .context("Failed to subscribe to topic")?;

        // Create producer
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", &config.brokers)
            .set("message.timeout.ms", "5000")
            .create()
            .context("Failed to create Kafka producer")?;

        Ok(Self {
            consumer,
            producer,
            config,
        })
    }
}

#[async_trait]
impl EventStreamProvider for RealEventStreamProvider {
    async fn consume_events(&self, topic: &str, batch_size: usize) -> Result<Vec<Transaction>> {
        let mut transactions = Vec::new();
        let timeout = Duration::from_millis(self.config.batch_timeout_ms);
        let max_messages = batch_size;

        // Note: topic parameter allows overriding, but we use configured topic by default
        let _topic_to_use = if topic.is_empty() {
            &self.config.input_topic
        } else {
            topic
        };

        // Poll messages up to batch size or timeout
        for _ in 0..max_messages {
            match tokio::time::timeout(timeout, self.consumer.recv()).await {
                Ok(Ok(message)) => {
                    if let Some(payload) = message.payload() {
                        match serde_json::from_slice::<Transaction>(payload) {
                            Ok(transaction) => transactions.push(transaction),
                            Err(e) => {
                                // Log but don't fail on deserialization errors
                                eprintln!("Failed to deserialize transaction: {}", e);
                            }
                        }
                    }
                }
                Ok(Err(e)) => {
                    return Err(anyhow::anyhow!("Kafka consumer error: {}", e));
                }
                Err(_) => {
                    // Timeout reached, return what we have
                    break;
                }
            }

            // If we've collected enough, break early
            if transactions.len() >= max_messages {
                break;
            }
        }

        Ok(transactions)
    }

    async fn produce_alert(&self, topic: &str, alert: &Alert) -> Result<()> {
        let payload = serde_json::to_vec(alert)
            .context("Failed to serialize alert")?;

        let key = alert.transaction_id.as_bytes();

        // Use provided topic or default
        let topic_to_use = if topic.is_empty() {
            &self.config.output_topic
        } else {
            topic
        };

        let record = FutureRecord::to(topic_to_use)
            .payload(&payload)
            .key(key);

        self.producer
            .send(record, Duration::from_secs(5))
            .await
            .map_err(|(e, _)| anyhow::anyhow!("Failed to send alert: {}", e))?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_config_default() {
        let config = EventStreamConfig::default();
        assert_eq!(config.brokers, "localhost:9092");
        assert_eq!(config.consumer_group_id, "molen-worker");
        assert_eq!(config.input_topic, "user-events");
        assert_eq!(config.output_topic, "fraud-alerts");
        assert_eq!(config.batch_size, 100);
        assert_eq!(config.batch_timeout_ms, 1000);
    }

    #[test]
    fn test_event_config_from_env() {
        std::env::set_var("KAFKA_BROKERS", "broker1:9092,broker2:9092");
        std::env::set_var("KAFKA_CONSUMER_GROUP", "test-group");
        std::env::set_var("KAFKA_INPUT_TOPIC", "test-input");
        std::env::set_var("KAFKA_OUTPUT_TOPIC", "test-output");
        std::env::set_var("KAFKA_BATCH_SIZE", "50");
        std::env::set_var("KAFKA_BATCH_TIMEOUT_MS", "2000");

        let config = EventStreamConfig::from_env();
        assert_eq!(config.brokers, "broker1:9092,broker2:9092");
        assert_eq!(config.consumer_group_id, "test-group");
        assert_eq!(config.input_topic, "test-input");
        assert_eq!(config.output_topic, "test-output");
        assert_eq!(config.batch_size, 50);
        assert_eq!(config.batch_timeout_ms, 2000);

        // Clean up
        std::env::remove_var("KAFKA_BROKERS");
        std::env::remove_var("KAFKA_CONSUMER_GROUP");
        std::env::remove_var("KAFKA_INPUT_TOPIC");
        std::env::remove_var("KAFKA_OUTPUT_TOPIC");
        std::env::remove_var("KAFKA_BATCH_SIZE");
        std::env::remove_var("KAFKA_BATCH_TIMEOUT_MS");
    }
}
