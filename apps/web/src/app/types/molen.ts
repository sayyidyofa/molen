// Core Type System for Project Molen
export enum DataType {
  NUMBER = "NUMBER",
  STRING = "STRING",
  BOOLEAN = "BOOLEAN",
  GEO_COORDINATES = "GEO_COORDINATES",
  TIMESTAMP = "TIMESTAMP",
  OBJECT = "OBJECT",
  ARRAY = "ARRAY",
}

export const DataTypeColors = {
  [DataType.NUMBER]: {
    color: "text-green-500",
    bg: "bg-green-500/20",
    border: "border-green-500/50",
    hex: "#10b981",
  },
  [DataType.STRING]: {
    color: "text-blue-500",
    bg: "bg-blue-500/20",
    border: "border-blue-500/50",
    hex: "#3b82f6",
  },
  [DataType.BOOLEAN]: {
    color: "text-purple-500",
    bg: "bg-purple-500/20",
    border: "border-purple-500/50",
    hex: "#a855f7",
  },
  [DataType.GEO_COORDINATES]: {
    color: "text-cyan-500",
    bg: "bg-cyan-500/20",
    border: "border-cyan-500/50",
    hex: "#06b6d4",
  },
  [DataType.TIMESTAMP]: {
    color: "text-orange-500",
    bg: "bg-orange-500/20",
    border: "border-orange-500/50",
    hex: "#f97316",
  },
  [DataType.OBJECT]: {
    color: "text-indigo-500",
    bg: "bg-indigo-500/20",
    border: "border-indigo-500/50",
    hex: "#6366f1",
  },
  [DataType.ARRAY]: {
    color: "text-violet-500",
    bg: "bg-violet-500/20",
    border: "border-violet-500/50",
    hex: "#8b5cf6",
  },
};

// Operators allowed per DataType
export enum OperatorType {
  EQUALS = "EQUALS",
  NOT_EQUALS = "NOT_EQUALS",
  GREATER_THAN = "GREATER_THAN",
  LESS_THAN = "LESS_THAN",
  GREATER_THAN_OR_EQUAL = "GREATER_THAN_OR_EQUAL",
  LESS_THAN_OR_EQUAL = "LESS_THAN_OR_EQUAL",
  CONTAINS = "CONTAINS",
  STARTS_WITH = "STARTS_WITH",
  ENDS_WITH = "ENDS_WITH",
  IN_LIST = "IN_LIST",
  NOT_IN_LIST = "NOT_IN_LIST",
  IS_TRUE = "IS_TRUE",
  IS_FALSE = "IS_FALSE",
  WITHIN_RADIUS = "WITHIN_RADIUS",
  BEFORE = "BEFORE",
  AFTER = "AFTER",
}

export const AllowedOperators: Record<DataType, OperatorType[]> = {
  [DataType.NUMBER]: [
    OperatorType.EQUALS,
    OperatorType.NOT_EQUALS,
    OperatorType.GREATER_THAN,
    OperatorType.LESS_THAN,
    OperatorType.GREATER_THAN_OR_EQUAL,
    OperatorType.LESS_THAN_OR_EQUAL,
    OperatorType.IN_LIST,
    OperatorType.NOT_IN_LIST,
  ],
  [DataType.STRING]: [
    OperatorType.EQUALS,
    OperatorType.NOT_EQUALS,
    OperatorType.CONTAINS,
    OperatorType.STARTS_WITH,
    OperatorType.ENDS_WITH,
    OperatorType.IN_LIST,
    OperatorType.NOT_IN_LIST,
  ],
  [DataType.BOOLEAN]: [OperatorType.IS_TRUE, OperatorType.IS_FALSE, OperatorType.EQUALS],
  [DataType.GEO_COORDINATES]: [OperatorType.WITHIN_RADIUS],
  [DataType.TIMESTAMP]: [
    OperatorType.EQUALS,
    OperatorType.BEFORE,
    OperatorType.AFTER,
    OperatorType.GREATER_THAN,
    OperatorType.LESS_THAN,
  ],
  [DataType.OBJECT]: [OperatorType.EQUALS, OperatorType.NOT_EQUALS],
  [DataType.ARRAY]: [OperatorType.CONTAINS, OperatorType.IN_LIST],
};

export enum ActionType {
  PASS = "PASS",
  FLAG = "FLAG",
  BLOCK = "BLOCK",
}

// Input Schema Types
export interface SchemaField {
  id: string;
  name: string;
  dataType: DataType;
  description?: string;
  required: boolean;
  properties?: SchemaField[];
  items?: SchemaField;
}

export interface InputSchema {
  id: string;
  name: string;
  version: string;
  fields: SchemaField[];
  status: "active" | "draft" | "deprecated";
  createdAt: string;
  updatedAt: string;
}

// Feature Extractor Types
export interface FeatureExtractor {
  id: string;
  name: string;
  schemaId: string; // Must reference an InputSchema
  fieldPath: string; // JSON path to the field
  outputType: DataType; // Mandatory DataType
  description?: string;
  status: "active" | "testing" | "draft";
  transformations?: string[]; // Optional transformations
}

// Rule Types
export interface RuleCondition {
  extractorId: string; // Must reference a FeatureExtractor
  operator: OperatorType;
  value: unknown;
  dataType: DataType; // Inherited from extractor
}

export interface Rule {
  id: string;
  name: string;
  conditions: RuleCondition[];
  action: ActionType;
  priority: number;
  status: "active" | "testing" | "draft";
  description?: string;
}

// Model Types
export interface Model {
  id: string;
  name: string;
  version: string;
  inputFeatures: Array<{
    extractorId: string;
    dataType: DataType;
  }>;
  outputType: DataType;
  accuracy: number;
  fpr: number;
  status: "deployed" | "training" | "testing";
}

// Orchestrator Node Types
export type NodeType = "extractor" | "rule" | "model";

export interface OrchestratorNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    entityId: string; // ID of the extractor/rule/model
    label: string;
    inputTypes?: DataType[];
    outputType?: DataType;
  };
}

export interface OrchestratorEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  animated: boolean;
  style?: Record<string, unknown>;
  valid?: boolean; // Type compatibility check
}

// Validation Types
export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  severity: "error" | "warning";
}

export interface TypeCompatibility {
  compatible: boolean;
  reason?: string;
}
