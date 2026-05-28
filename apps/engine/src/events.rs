use async_trait::async_trait;
use rdkafka::admin::{AdminClient, AdminOptions, NewTopic, TopicReplication};
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

pub async fn create_topics(brokers: &str, topics: &[&str]) -> Result<(), String> {
    let admin_client: AdminClient<_> = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .create()
        .expect("AdminClient creation failed");

    let new_topics: Vec<NewTopic> = topics
        .iter()
        .map(|t| NewTopic::new(t, 1, TopicReplication::Fixed(1)))
        .collect();

    let options = AdminOptions::new();
    let results = admin_client
        .create_topics(&new_topics, &options)
        .await
        .map_err(|e| e.to_string())?;

    for result in results {
        match result {
            Ok(topic) => println!("Topic created: {topic}"),
            Err((topic, err)) => {
                // Ignore if topic already exists
                if err.to_string().contains("TopicAlreadyExists")
                    || err.to_string().contains("already exists")
                {
                    println!("Topic already exists: {topic}");
                } else {
                    eprintln!("Error creating topic {topic}: {err}");
                }
            }
        }
    }

    Ok(())
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
