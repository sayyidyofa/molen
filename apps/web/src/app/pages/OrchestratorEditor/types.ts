import { type Node as FlowNode } from "@xyflow/react";
import { type AggType } from "../../components/orchestrator/LogicAggregatorNode";

export interface NodeData extends Record<string, unknown> {
  label: string;
  entityId?: string;
  outputType?: string;
  path?: string;
  condition?: string;
  anomalyScore?: number;
  method?: "avg" | "max" | "sum_cap";
  aggType?: AggType;
  allowedInputType?: string;
  connectionCount?: number;
  triggered?: boolean;
  runtimeScore?: number;
  aggregateScore?: number;
  contributorCount?: number;
  version?: string;
  accuracy?: number;
}

export type MolenNode = FlowNode<NodeData>;

export interface ValidationMessage {
  type: "error" | "warning" | "ok";
  text: string;
}

export const DRAG_KEY = "application/molen-node";

export const OUTPUT_TYPE_COLORS: Record<string, string> = {
  Float: "text-green-400 border-green-500/40 bg-green-500/10",
  Integer: "text-green-400 border-green-500/40 bg-green-500/10",
  NUMBER: "text-green-400 border-green-500/40 bg-green-500/10",
  String: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  STRING: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  GeoCoordinates: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  GEO: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  Boolean: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  BOOLEAN: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  ANOMALY_SCORE: "text-orange-400 border-orange-500/40 bg-orange-500/10",
};
