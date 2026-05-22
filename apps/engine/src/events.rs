use async_trait::async_trait;
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::message::Message;
use rdkafka::producer::{FutureProducer, FutureRecord};
use std::time::Duration;

#[async_trait]
pub trait EventConsumer: Send + Sync {
    async fn recv(&self) -> Result<String, String>;
}

#[async_trait]
pub trait EventProducer: Send + Sync {
    async fn send(&self, topic: &str, key: &str, payload: &str) -> Result<(), String>;
}

pub struct KafkaConsumer {
    consumer: StreamConsumer,
}

impl KafkaConsumer {
    pub fn new(brokers: &str, group_id: &str, topic: &str) -> Self {
        let consumer: StreamConsumer = ClientConfig::new()
            .set("group.id", group_id)
            .set("bootstrap.servers", brokers)
            .set("enable.auto.commit", "true")
            .set("auto.offset.reset", "smallest")
            .create()
            .expect("Consumer creation failed");

        consumer
            .subscribe(&[topic])
            .expect("Can't subscribe to topic");
        Self { consumer }
    }
}

#[async_trait]
impl EventConsumer for KafkaConsumer {
    async fn recv(&self) -> Result<String, String> {
        match self.consumer.recv().await {
            Ok(m) => {
                let payload = match m.payload_view::<str>() {
                    Some(Ok(p)) => p,
                    Some(Err(e)) => return Err(format!("Invalid UTF-8: {e}")),
                    None => "",
                };
                Ok(payload.to_string())
            }
            Err(e) => Err(e.to_string()),
        }
    }
}

pub struct KafkaProducer {
    producer: FutureProducer,
}

impl KafkaProducer {
    pub fn new(brokers: &str) -> Self {
        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", brokers)
            .set("message.timeout.ms", "5000")
            .create()
            .expect("Producer creation failed");
        Self { producer }
    }
}

#[async_trait]
impl EventProducer for KafkaProducer {
    async fn send(&self, topic: &str, key: &str, payload: &str) -> Result<(), String> {
        let record = FutureRecord::to(topic).payload(payload).key(key);

        match self.producer.send(record, Duration::from_secs(0)).await {
            Ok(_) => Ok(()),
            Err((e, _)) => Err(e.to_string()),
        }
    }
}
