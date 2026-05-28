#![warn(clippy::pedantic)]
#![deny(warnings)]

mod evaluator;
mod events;

use evaluator::evaluate_graph;
use events::{create_topics, EventConsumer, EventProducer, KafkaConsumer, KafkaProducer};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Node {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Edge {
    pub id: String,
    pub source: String,
    pub target: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OrchestratorGraph {
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScoreOutput {
    pub transaction_id: String,
    pub score: usize,
    pub node_count: usize,
    pub timestamp: u64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Transaction {
    pub id: String,
    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

type SharedGraph = Arc<RwLock<Option<OrchestratorGraph>>>;

#[tokio::main]
async fn main() {
    let brokers = std::env::var("KAFKA_BROKERS").unwrap_or_else(|_| "localhost:19092".to_string());
    let control_topic =
        std::env::var("MOLEN_CONTROL_TOPIC").unwrap_or_else(|_| "molen_control_dev".to_string());
    let inbound_topic = std::env::var("MOLEN_INBOUND_TOPIC")
        .unwrap_or_else(|_| "molen_transactions_in".to_string());
    let outbound_topic =
        std::env::var("MOLEN_OUTBOUND_TOPIC").unwrap_or_else(|_| "molen_scores_out".to_string());

    if std::env::var("SEED_KAFKA").unwrap_or_else(|_| "false".to_string()) == "true" {
        println!("Seeding Kafka topics...");
        if let Err(e) =
            create_topics(&brokers, &[&control_topic, &inbound_topic, &outbound_topic]).await
        {
            eprintln!("Failed to seed Kafka topics: {e}");
        }
    }

    println!("Starting Molen Engine with brokers: {brokers}");

    let shared_graph: SharedGraph = Arc::new(RwLock::new(None));

    let control_consumer = KafkaConsumer::new(
        &brokers,
        &format!("molen-engine-control-{}", uuid::Uuid::new_v4()),
        &control_topic,
    );

    let transaction_consumer = KafkaConsumer::new(
        &brokers,
        &format!("molen-engine-transactions-{}", uuid::Uuid::new_v4()),
        &inbound_topic,
    );

    let producer = KafkaProducer::new(&brokers);

    let graph_clone = shared_graph.clone();
    tokio::spawn(async move {
        println!("Control plane consumer started on topic: {control_topic}");
        loop {
            match control_consumer.recv().await {
                Ok(payload) => {
                    if payload.is_empty() {
                        continue;
                    }
                    println!("Received new deployment: {payload}");
                    match serde_json::from_str::<OrchestratorGraph>(&payload) {
                        Ok(graph) => {
                            let mut g = graph_clone.write().await;
                            *g = Some(graph);
                            println!("Graph updated successfully");
                        }
                        Err(e) => eprintln!("Failed to parse orchestrator graph: {e}"),
                    }
                }
                Err(e) => eprintln!("Kafka error (control): {e}"),
            }
        }
    });

    let graph_clone = shared_graph.clone();
    println!("Transaction data plane consumer started on topic: {inbound_topic}");
    loop {
        match transaction_consumer.recv().await {
            Ok(payload) => {
                if payload.is_empty() {
                    continue;
                }
                println!("Processing transaction: {payload}");

                let transaction: Transaction = match serde_json::from_str(&payload) {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to parse transaction: {e}");
                        continue;
                    }
                };

                let graph = graph_clone.read().await;
                if let Some(ref g) = *graph {
                    let output = evaluate_graph(g, &transaction);
                    println!(
                        "Processed transaction {}. Score: {}",
                        output.transaction_id, output.score
                    );

                    let output_json =
                        serde_json::to_string(&output).expect("Failed to serialize score");
                    if let Err(e) = producer
                        .send(&outbound_topic, &output.transaction_id, &output_json)
                        .await
                    {
                        eprintln!("Failed to publish score: {e}");
                    } else {
                        println!("Successfully published score to {outbound_topic}");
                    }
                } else {
                    println!("No graph deployed yet. Skipping transaction.");
                }
            }
            Err(e) => eprintln!("Kafka error (transaction): {e}"),
        }
    }
}
