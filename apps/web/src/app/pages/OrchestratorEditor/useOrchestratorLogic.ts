import { useCallback, useState, useEffect, type DragEvent } from "react";
import { useParams, useNavigate } from "react-router";
import {
  useNodesState,
  useEdgesState,
  type Edge,
  type ReactFlowInstance,
} from "@xyflow/react";
import { toast } from "sonner";
import { useCombinedAppState, useSaveDraft, useCommitVersion, useDraft } from "../../hooks/useMolenApi";
import { type MolenNode, type NodeData, type ValidationMessage, DRAG_KEY } from "./types";
import { useConnectionLogic } from "./useConnectionLogic";
import { type Draft, type FeatureExtractor, type Rule, type MLModel, type OrchestratorGraph } from "@molen/shared-types";

let nodeIdCounter = 100;
const genId = () => `n${++nodeIdCounter}`;

export function useOrchestratorLogic() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useCombinedAppState();
  const { data: draft } = useDraft(id!);

  const orchestrator = (state.orchestrators as Draft[]).find((o) => o.id === id) || draft;

  const [activeTab, setActiveTab] = useState("editor");
  const [nodes, setNodes, onNodesChange] = useNodesState<MolenNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<MolenNode, Edge> | null>(null);
  const [selectedNode, setSelectedNode] = useState<MolenNode | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [testOpen, setTestOpen] = useState(false);
  const [validationMsg, setValidationMsg] = useState<ValidationMessage | null>(null);

  useEffect(() => {
    if (orchestrator?.graph) {
      setNodes(orchestrator.graph.nodes as MolenNode[]);
      setEdges(orchestrator.graph.edges as Edge[]);
    }
  }, [orchestrator, setNodes, setEdges]);

  const showValidation = useCallback((msg: ValidationMessage, duration = 4000) => {
    setValidationMsg(msg);
    setTimeout(() => setValidationMsg(null), duration);
  }, []);

  const onConnect = useConnectionLogic(nodes, setNodes, setEdges, showValidation);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: MolenNode) => {
      setSelectedNode(node);
      if (!propertiesOpen) setPropertiesOpen(true);
    },
    [propertiesOpen]
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!rfInstance) return;
      const raw = e.dataTransfer.getData(DRAG_KEY);
      if (!raw) return;
      const { nodeType, nodeData } = JSON.parse(raw) as { nodeType: string; nodeData: NodeData };
      const newNode: MolenNode = { 
        id: genId(), 
        type: nodeType, 
        position: rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY }), 
        data: nodeData 
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [rfInstance, setNodes]
  );

  const handleScoreChange = useCallback(
    (score: number) => {
      if (!selectedNode) return;
      setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, anomalyScore: score } } : n)));
      setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, anomalyScore: score } } : null));
    },
    [selectedNode, setNodes]
  );

  const handleEntityBind = useCallback(
    (entityType: string, entityId: string) => {
      if (!selectedNode) return;
      let label = selectedNode.data.label;
      let extra: Record<string, unknown> = {};
      if (entityType === "featureExtractor") {
        const fe = (state.featureExtractors as FeatureExtractor[]).find((x) => x.id === entityId);
        if (fe) { label = fe.name; extra = { outputType: fe.outputType, path: fe.sourceField }; }
      } else if (entityType === "rule") {
        const r = (state.rules as Rule[]).find((x) => x.id === entityId);
        if (r) label = r.name;
      } else if (entityType === "model") {
        const m = (state.models as MLModel[]).find((x) => x.id === entityId);
        if (m) { label = m.name; extra = { version: m.version, accuracy: m.accuracy }; }
      }
      setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, entityId, label, ...extra } } : n)));
      setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, entityId, label, ...extra } } : null));
      toast.success("Bound node to registry entity");
    },
    [selectedNode, setNodes, state]
  );

  const handleMethodChange = useCallback(
    (method: "avg" | "max" | "sum_cap") => {
      if (!selectedNode) return;
      setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, method } } : n)));
      setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, method } } : null));
    },
    [selectedNode, setNodes]
  );

  const saveDraft = useSaveDraft();
  const commitVersion = useCommitVersion();

  const handleSave = () => {
    const currentNodes = rfInstance ? rfInstance.getNodes() : nodes;
    const currentEdges = rfInstance ? rfInstance.getEdges() : edges;
    saveDraft.mutate({
      id: id!,
      name: orchestrator?.name ?? "New Orchestrator",
      graph: { nodes: currentNodes as unknown as OrchestratorGraph['nodes'], edges: currentEdges as unknown as OrchestratorGraph['edges'] },
      updatedAt: new Date(),
    }, {
      onSuccess: () => toast.success("Orchestrator saved", { description: `${currentNodes.length} nodes · ${currentEdges.length} edges` }),
      onError: (err: Error) => toast.error("Failed to save orchestrator", { description: err.message }),
    });
  };

  const handleCommitVersion = () => {
    if (!id) return;
    const currentNodes = rfInstance ? rfInstance.getNodes() : nodes;
    const currentEdges = rfInstance ? rfInstance.getEdges() : edges;
    saveDraft.mutate({
      id: id!,
      name: orchestrator?.name ?? "New Orchestrator",
      graph: { nodes: currentNodes as unknown as OrchestratorGraph['nodes'], edges: currentEdges as unknown as OrchestratorGraph['edges'] },
      updatedAt: new Date(),
    }, {
      onSuccess: () => commitVersion.mutate(id, {
        onSuccess: (version: { version: string | number }) => toast.success("Version committed", { description: `v${version.version} created` }),
        onError: (err: Error) => toast.error("Failed to commit version", { description: err.message }),
      }),
    });
  };

  return {
    id, navigate, orchestrator, activeTab, setActiveTab, nodes, setNodes, onNodesChange,
    edges, setEdges, onEdgesChange, rfInstance, setRfInstance, selectedNode, setSelectedNode,
    paletteOpen, setPaletteOpen, propertiesOpen, setPropertiesOpen, testOpen, setTestOpen,
    validationMsg, onConnect, onNodeClick, onDragOver, onDrop,
    handleScoreChange, handleEntityBind, handleMethodChange, handleSave, handleCommitVersion,
  };
}
