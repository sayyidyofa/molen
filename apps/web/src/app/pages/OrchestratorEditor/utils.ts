import { type MolenNode } from "./types";

// Maps node outputType/DataType to a canonical DataType key for comparison
export function getSourceDataType(node: MolenNode | undefined): string | null {
  if (!node) return null;
  switch (node.type) {
    case "featureExtractor": {
      const t = node.data.outputType;
      if (t === "Float" || t === "Integer") return "NUMBER";
      if (t === "String") return "STRING";
      if (t === "Boolean") return "BOOLEAN";
      if (t === "GeoCoordinates") return "GEO";
      return t ?? null;
    }
    case "rule":
    case "model":
      return "ANOMALY_SCORE";
    case "logicAggregator":
      return node.data.outputType ?? null;
    default:
      return null;
  }
}
