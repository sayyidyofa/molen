use crate::{OrchestratorGraph, ScoreOutput, Transaction};
use serde_json::Value;
use std::collections::HashMap;
use regex::Regex;

pub struct EvaluationContext {
    pub transaction: Transaction,
    pub node_values: HashMap<String, Value>,
}

pub fn evaluate_graph(graph: &OrchestratorGraph, transaction: &Transaction) -> ScoreOutput {
    let mut context = EvaluationContext {
        transaction: transaction.clone(),
        node_values: HashMap::new(),
    };

    // 1. Identify input nodes and initialize them
    for node in &graph.nodes {
        if node.kind.to_uppercase() == "INPUT" {
             context.node_values.insert(node.id.clone(), Value::Object(transaction.extra.clone()));
        }
    }

    // 2. Simple iterative evaluation
    let max_iterations = graph.nodes.len() * 2;
    for _ in 0..max_iterations {
        let mut newly_resolved = 0;
        for node in &graph.nodes {
            if context.node_values.contains_key(&node.id) {
                continue;
            }

            // Check if all inputs are resolved
            let mut inputs = Vec::new();
            let mut all_inputs_resolved = true;
            for edge in &graph.edges {
                if edge.target == node.id {
                    if let Some(val) = context.node_values.get(&edge.source) {
                        inputs.push(val);
                    } else {
                        all_inputs_resolved = false;
                        break;
                    }
                }
            }

            if all_inputs_resolved {
                if let Some(val) = evaluate_node(node, &inputs, &context) {
                    context.node_values.insert(node.id.clone(), val);
                    newly_resolved += 1;
                }
            }
        }
        if newly_resolved == 0 {
            break;
        }
    }

    // 3. Final score is the sum of all terminal nodes that produce anomaly scores
    let mut final_score = 0.0;
    
    // Find nodes with no outgoing edges
    let terminal_nodes: Vec<_> = graph.nodes.iter()
        .filter(|n| !graph.edges.iter().any(|e| e.source == n.id))
        .collect();

    if !terminal_nodes.is_empty() {
        for node in terminal_nodes {
            if let Some(val) = context.node_values.get(&node.id) {
                if let Some(n) = val.as_f64() {
                    // Only add to score if it's from a node that produces scores
                    if node.kind.to_uppercase() == "AGGREGATOR" || 
                       node.kind.to_uppercase() == "RULE" || 
                       node.kind.to_uppercase() == "MODEL" {
                        final_score += n;
                    }
                }
            }
        }
    }

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();

    ScoreOutput {
        transaction_id: transaction.id.clone(),
        score: final_score as usize,
        node_count: graph.nodes.len(),
        timestamp,
    }
}

fn evaluate_node(node: &crate::Node, inputs: &[&Value], context: &EvaluationContext) -> Option<Value> {
    match node.kind.to_uppercase().as_str() {
        "EXTRACTOR" => {
            let field_path = node.data.get("config").and_then(|c| c.get("fieldPath")).and_then(|f| f.as_str())?;
            context.transaction.extra.get(field_path).cloned()
        }
        "RULE" => {
            let config = node.data.get("config")?;
            let condition = config.get("condition").and_then(|f| f.as_str())?;
            let score = config.get("anomalyScore").and_then(|f| f.as_f64()).unwrap_or(0.0);
            
            if evaluate_condition(condition, inputs) {
                Some(Value::from(score))
            } else {
                Some(Value::from(0.0))
            }
        }
        "MODEL" => {
             let score = node.data.get("config").and_then(|c| c.get("anomalyScore")).and_then(|f| f.as_f64()).unwrap_or(50.0);
             Some(Value::from(score))
        }
        "AGGREGATOR" => {
            let op = node.data.get("config").and_then(|c| c.get("operation")).and_then(|f| f.as_str()).unwrap_or("SUM");
            let values: Vec<f64> = inputs.iter().filter_map(|v| v.as_f64()).collect();
            if values.is_empty() { return Some(Value::from(0.0)); }

            let result = match op.to_uppercase().as_str() {
                "SUM" => values.iter().sum(),
                "AVG" => values.iter().sum::<f64>() / values.len() as f64,
                "MAX" => values.iter().fold(f64::MIN, |a, &b| a.max(b)),
                "MIN" => values.iter().fold(f64::MAX, |a, &b| a.min(b)),
                _ => values.iter().sum(),
            };
            Some(Value::from(result))
        }
        "INPUT" => {
            Some(Value::Object(context.transaction.extra.clone()))
        }
        _ => None
    }
}

fn evaluate_condition(condition: &str, inputs: &[&Value]) -> bool {
    let input_val = if let Some(val) = inputs.first() {
        val
    } else {
        return false;
    };

    let re = Regex::new(r"\{\{input.*?\}\}\s*(>|<|==|!=|>=|<=)\s*(.+)").unwrap();
    if let Some(caps) = re.captures(condition) {
        let op = &caps[1];
        let val_str = caps[2].trim();

        if let Some(i_f) = input_val.as_f64() {
             if let Ok(t_f) = val_str.parse::<f64>() {
                 return match op {
                    ">" => i_f > t_f,
                    "<" => i_f < t_f,
                    "==" => (i_f - t_f).abs() < f64::EPSILON,
                    "!=" => (i_f - t_f).abs() > f64::EPSILON,
                    ">=" => i_f >= t_f,
                    "<=" => i_f <= t_f,
                    _ => false,
                };
             }
        }
        
        if let Some(i_s) = input_val.as_str() {
            let t_s = val_str.trim_matches('"').trim_matches('\'');
            return match op {
                "==" => i_s == t_s,
                "!=" => i_s != t_s,
                _ => false,
            };
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Edge, Node};
    use serde_json::json;

    #[test]
    fn test_evaluate_graph_full_pipeline() {
        let graph = OrchestratorGraph {
            nodes: vec![
                Node {
                    id: "n1".to_string(),
                    kind: "extractor".to_string(),
                    data: json!({"config": {"fieldPath": "amount"}}),
                },
                Node {
                    id: "n2".to_string(),
                    kind: "rule".to_string(),
                    data: json!({"config": {"condition": "{{input}} > 1000", "anomalyScore": 80.0}}),
                },
                Node {
                    id: "n3".to_string(),
                    kind: "aggregator".to_string(),
                    data: json!({"config": {"operation": "SUM"}}),
                },
            ],
            edges: vec![
                Edge { id: "e1".to_string(), source: "n1".to_string(), target: "n2".to_string() },
                Edge { id: "e2".to_string(), source: "n2".to_string(), target: "n3".to_string() },
            ],
        };

        // Case 1: Rule triggered
        let mut extra = serde_json::Map::new();
        extra.insert("amount".to_string(), json!(5000));
        let transaction = Transaction { id: "tx-1".to_string(), extra };
        let output = evaluate_graph(&graph, &transaction);
        assert_eq!(output.score, 80);

        // Case 2: Rule NOT triggered
        let mut extra = serde_json::Map::new();
        extra.insert("amount".to_string(), json!(500));
        let transaction = Transaction { id: "tx-2".to_string(), extra };
        let output = evaluate_graph(&graph, &transaction);
        assert_eq!(output.score, 0);
    }

    #[test]
    fn test_evaluate_graph_nested_extraction() {
        let graph = OrchestratorGraph {
            nodes: vec![
                Node {
                    id: "n1".to_string(),
                    kind: "extractor".to_string(),
                    data: json!({"config": {"fieldPath": "user_id"}}),
                },
                Node {
                    id: "n2".to_string(),
                    kind: "rule".to_string(),
                    data: json!({"config": {"condition": "{{input}} == \"USER_123\"", "anomalyScore": 50.0}}),
                },
            ],
            edges: vec![
                Edge { id: "e1".to_string(), source: "n1".to_string(), target: "n2".to_string() },
            ],
        };

        let mut extra = serde_json::Map::new();
        extra.insert("user_id".to_string(), json!("USER_123"));
        let transaction = Transaction { id: "tx-1".to_string(), extra };
        let output = evaluate_graph(&graph, &transaction);
        assert_eq!(output.score, 50);
    }
}
