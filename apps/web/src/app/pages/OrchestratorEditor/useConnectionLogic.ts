import { useCallback, useRef } from "react";
import { addEdge, type Connection, type Edge } from "@xyflow/react";
import { toast } from "sonner";
import { type MolenNode, type ValidationMessage } from "./types";
import { getSourceDataType } from "./utils";
import { AGG_TYPE_CONFIG, type AggType } from "../../components/orchestrator/LogicAggregatorNode";

export function useConnectionLogic(
  nodes: MolenNode[],
  setNodes: (nds: MolenNode[] | ((prev: MolenNode[]) => MolenNode[])) => void,
  setEdges: (eds: Edge[] | ((prev: Edge[]) => Edge[])) => void,
  showValidation: (msg: ValidationMessage, duration?: number) => void
) {
  const invalidEdgeRef = useRef<string | null>(null);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (targetNode?.type === "logicAggregator") {
        const sourceType = getSourceDataType(sourceNode);
        const required = targetNode.data.allowedInputType;

        if (sourceType !== required) {
          invalidEdgeRef.current = `e${params.source}-${params.target}-${Date.now()}`;
          setEdges((eds) =>
            addEdge(
              {
                ...params,
                id: invalidEdgeRef.current!,
                animated: true,
                style: { stroke: "#ef4444", strokeWidth: 3, strokeDasharray: "5,5" },
              },
              eds
            )
          );
          setTimeout(() => {
            setEdges((eds) => eds.filter((e) => e.id !== invalidEdgeRef.current));
            invalidEdgeRef.current = null;
          }, 1500);

          toast.error("Type mismatch", {
            description: `${targetNode.data.aggType} aggregator requires ${required}, but received ${sourceType}.`,
          });
          showValidation({
            type: "error",
            text: `Cannot connect ${sourceType} → ${targetNode.data.aggType} aggregator (requires ${required}).`,
          });
          return;
        }

        const aggCfg = AGG_TYPE_CONFIG[targetNode.data.aggType as AggType];
        const gradId = aggCfg.category === "math" ? "logic-num-gradient" : "logic-bool-gradient";
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              id: `e${params.source}-${params.target}-${Date.now()}`,
              animated: true,
              style: { stroke: `url(#${gradId})`, strokeWidth: 2.5 },
            },
            eds
          )
        );
        showValidation({ type: "ok", text: `Valid ${required} connection to ${targetNode.data.aggType} aggregator.` }, 2500);

        setNodes((nds) =>
          nds.map((n) =>
            n.id === targetNode.id
              ? { ...n, data: { ...n.data, connectionCount: (n.data.connectionCount as number ?? 0) + 1 } }
              : n
          )
        );
        return;
      }

      const isAnomalyEdge = sourceNode?.type === "rule" || sourceNode?.type === "model";
      const isLogicOutput = sourceNode?.type === "logicAggregator";
      let strokeStyle: React.CSSProperties;
      if (isAnomalyEdge) {
        strokeStyle = { stroke: "url(#anomaly-gradient)", strokeWidth: 3 };
      } else if (isLogicOutput) {
        const cfg = sourceNode?.data?.aggType ? AGG_TYPE_CONFIG[sourceNode.data.aggType as AggType] : null;
        const gradId = cfg?.category === "math" ? "logic-num-gradient" : "logic-bool-gradient";
        strokeStyle = { stroke: `url(#${gradId})`, strokeWidth: 2 };
      } else {
        strokeStyle = { stroke: "url(#edge-gradient)", strokeWidth: 2 };
      }

      setEdges((eds) =>
        addEdge(
          { ...params, id: `e${params.source}-${params.target}-${Date.now()}`, animated: true, style: strokeStyle },
          eds
        )
      );

      if (isAnomalyEdge && targetNode?.type === "aggregator") {
        showValidation({ type: "ok", text: "ANOMALY_SCORE connection valid — score will be aggregated at the sink." }, 2500);
      }
    },
    [nodes, setEdges, setNodes, showValidation]
  );

  return onConnect;
}
