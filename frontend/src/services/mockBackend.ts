/**
 * Mock Backend Service for Molen Platform
 * Simulates API calls with network latency
 */

import type { Node, Edge } from '@xyflow/react';
import { Decision } from '../types/molen';
import type {
  Transaction,
  InferenceResult,
  MolenNodeData,
  DeploymentEnv,
  DeploymentResult,
  TestResult,
} from '../types/molen';

/**
 * Simulates network latency
 */
const delay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generates a random transaction for testing
 */
export const generateMockTransaction = (): Transaction => {
  return {
    id: `txn_${Math.random().toString(36).substr(2, 9)}`,
    user_id: `user_${Math.random().toString(36).substr(2, 9)}`,
    amount: Math.floor(Math.random() * 10000) + 10,
    currency: 'USD',
    merchant: ['Amazon', 'Apple', 'Google', 'Netflix', 'Uber'][
      Math.floor(Math.random() * 5)
    ],
    timestamp: new Date().toISOString(),
    ip_address: `${Math.floor(Math.random() * 256)}.${Math.floor(
      Math.random() * 256
    )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
    device_id: `device_${Math.random().toString(36).substr(2, 9)}`,
    country: ['US', 'UK', 'CA', 'AU', 'DE'][Math.floor(Math.random() * 5)],
  };
};

/**
 * Evaluates a node with mock data
 */
export const evaluateNode = async (
  nodeId: string,
  config: MolenNodeData,
  mockTransaction: Transaction
): Promise<TestResult> => {
  // Simulate network latency
  await delay(500 + Math.random() * 500);

  let result: InferenceResult;
  const startTime = Date.now();

  try {
    // Mock evaluation based on node type
    switch (config.nodeType) {
      case 'logic_gate':
        result = evaluateLogicGate(config, mockTransaction);
        break;
      case 'velocity_check':
        result = evaluateVelocityCheck(config, mockTransaction);
        break;
      case 'ml_model':
        result = evaluateMLModel(config, mockTransaction);
        break;
      case 'enrichment':
        result = evaluateEnrichment(config, mockTransaction);
        break;
      default:
        result = {
          decision: Decision.PASS,
          fraud_score: 0.1,
          confidence: 0.95,
          reason: 'No evaluation performed',
          timestamp: new Date().toISOString(),
        };
    }

    const executionTime = Date.now() - startTime;

    return {
      nodeId,
      success: true,
      result,
      executionTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      nodeId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Mock evaluation for Logic Gate node
 */
const evaluateLogicGate = (
  config: MolenNodeData,
  transaction: Transaction
): InferenceResult => {
  const { threshold = 1000, operator = 'gt', field = 'amount' } = config;
  const value = transaction[field as keyof Transaction] as number;

  let passes = false;
  switch (operator) {
    case 'gt':
      passes = value > threshold;
      break;
    case 'lt':
      passes = value < threshold;
      break;
    case 'gte':
      passes = value >= threshold;
      break;
    case 'lte':
      passes = value <= threshold;
      break;
    case 'eq':
      passes = value === threshold;
      break;
  }

  return {
    decision: passes ? Decision.BLOCK : Decision.PASS,
    fraud_score: passes ? 0.9 : 0.1,
    confidence: 0.98,
    reason: passes
      ? `${field} ${operator} ${threshold} (${value})`
      : `${field} passed threshold check`,
    rule_triggered: config.label,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Mock evaluation for Velocity Check node
 */
const evaluateVelocityCheck = (
  config: MolenNodeData,
  _transaction: Transaction
): InferenceResult => {
  const { timeWindow = 3600, maxCount = 5 } = config;
  const currentCount = Math.floor(Math.random() * 10);

  const breached = currentCount > maxCount;

  return {
    decision: breached ? Decision.FLAG : Decision.PASS,
    fraud_score: breached ? 0.7 : 0.2,
    confidence: 0.85,
    reason: breached
      ? `Velocity breach: ${currentCount} txns in ${timeWindow}s (max: ${maxCount})`
      : `Velocity check passed: ${currentCount}/${maxCount} in ${timeWindow}s`,
    rule_triggered: config.label,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Mock evaluation for ML Model node
 */
const evaluateMLModel = (
  config: MolenNodeData,
  _transaction: Transaction
): InferenceResult => {
  const { modelVersion = 'v1.0', modelType = 'xgboost' } = config;
  const fraudScore = Math.random();

  let decision: Decision;
  if (fraudScore > 0.8) {
    decision = Decision.BLOCK;
  } else if (fraudScore > 0.5) {
    decision = Decision.FLAG;
  } else {
    decision = Decision.PASS;
  }

  return {
    decision,
    fraud_score: fraudScore,
    confidence: 0.9,
    reason: `ML inference (${modelType})`,
    model_version: modelVersion,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Mock evaluation for Enrichment node
 */
const evaluateEnrichment = (
  config: MolenNodeData,
  _transaction: Transaction
): InferenceResult => {
  const { enrichmentType = 'user_history' } = config;

  return {
    decision: Decision.PASS,
    fraud_score: Math.random() * 0.3,
    confidence: 0.95,
    reason: `Enriched with ${enrichmentType}`,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Mock deployment of a graph
 */
export const deployGraph = async (
  nodes: Node[],
  _edges: Edge[],
  env: DeploymentEnv
): Promise<DeploymentResult> => {
  // Simulate network latency
  await delay(1000 + Math.random() * 1000);

  // Validate graph (basic check)
  if (nodes.length === 0) {
    throw new Error('Cannot deploy empty graph');
  }

  const deploymentId = `deploy_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  return {
    status: 'success',
    deploymentId,
    environment: env,
    timestamp: new Date().toISOString(),
    message: `Successfully deployed ${nodes.length} nodes to ${env} environment`,
  };
};

/**
 * Mock backend class (alternative API)
 */
export class MockBackend {
  async evaluateNode(
    nodeId: string,
    config: MolenNodeData,
    transaction: Transaction
  ): Promise<TestResult> {
    return evaluateNode(nodeId, config, transaction);
  }

  async deployGraph(
    nodes: Node[],
    edges: Edge[],
    env: DeploymentEnv
  ): Promise<DeploymentResult> {
    return deployGraph(nodes, edges, env);
  }

  generateMockTransaction(): Transaction {
    return generateMockTransaction();
  }
}

export const mockBackend = new MockBackend();
