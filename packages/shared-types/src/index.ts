export enum DataType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATETIME = 'DATETIME',
  TIMESTAMP = 'TIMESTAMP',
  OBJECT = 'OBJECT',
  ARRAY = 'ARRAY',
  GEO_COORDINATES = 'GEO_COORDINATES',
  ANOMALY_SCORE = 'ANOMALY_SCORE'
}

export enum RuleAction {
  ALLOW = 'ALLOW',
  REVIEW = 'REVIEW',
  BLOCK = 'BLOCK'
}

export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
  properties?: SchemaField[];
  items?: SchemaField;
}

export interface InputSchema {
  id: string;
  name: string;
  fields: SchemaField[];
  version?: string;
  status?: string;
}

export interface FeatureExtractor {
  id: string;
  name: string;
  sourceField: string;
  transformation: string;
  outputType: DataType;
}

export interface Rule {
  id: string;
  name: string;
  condition: string;
  anomalyScore: number;
  action: RuleAction;
}

export interface MLModel {
  id: string;
  name: string;
  modelUrl: string;
  outputType: DataType.ANOMALY_SCORE;
  version?: string;
  accuracy?: number;
  fpr?: number;
  status?: string;
}

export enum NodeType {
  INPUT = 'INPUT',
  EXTRACTOR = 'EXTRACTOR',
  RULE = 'RULE',
  MODEL = 'MODEL',
  AGGREGATOR = 'AGGREGATOR'
}

export interface Node {
  id: string;
  type: NodeType | string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
  config?: InputSchema | FeatureExtractor | Rule | MLModel | Record<string, unknown>;
  cardinality?: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE';
  aggregator?: 'SUM' | 'AVG' | 'MAX' | 'MIN';
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

export interface OrchestratorGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface Draft {
  id: string;
  name: string;
  description?: string;
  graph: OrchestratorGraph;
  updatedAt: Date;
  status?: string;
}

export interface CommittedVersion {
  id: string;
  draftId: string;
  version: number;
  graph: OrchestratorGraph;
  committedAt: Date;
}

export interface DeploymentEnvironment {
  id: string;
  name: string;
  activeVersionId: string;
  deployedAt: Date;
}

export interface RuleType {
  id: string;
  name: string;
  baseType: string;
  schema?: Record<string, unknown>;
  description?: string;
}

export interface TypedRule {
  id: string;
  name: string;
  ruleTypeId: string;
  description?: string;
  mode: string;
  visualBlocks?: Record<string, unknown>;
  codeExpression?: string;
  action: RuleAction;
  priority: number;
  status: string;
}
