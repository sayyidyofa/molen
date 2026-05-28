import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "../components/ui/button";
import {
  TooltipProvider,
} from "../components/ui/tooltip";
import {
  ChevronRight,
  ChevronLeft,
  Boxes,
} from "lucide-react";
import { FeatureExtractorNode } from "../components/orchestrator/FeatureExtractorNode";
import { RuleNode } from "../components/orchestrator/RuleNode";
import { ModelNode } from "../components/orchestrator/ModelNode";
import { AggregatorNode } from "../components/orchestrator/AggregatorNode";
import {
  LogicAggregatorNode,
  type AggType,
} from "../components/orchestrator/LogicAggregatorNode";
import { DeploymentsView } from "../components/orchestrator/DeploymentsView";
import { PaletteItem, AggSymbol } from "./OrchestratorEditor/components/PaletteItem";
import { EditorHeader } from "./OrchestratorEditor/components/EditorHeader";
import { PropertiesPanel } from "./OrchestratorEditor/components/PropertiesPanel";
import { TestRunDialog } from "./OrchestratorEditor/components/TestRunDialog";
import { useOrchestratorLogic } from "./OrchestratorEditor/useOrchestratorLogic";

const nodeTypes = {
  featureExtractor: FeatureExtractorNode,
  rule: RuleNode,
  model: ModelNode,
  aggregator: AggregatorNode,
  logicAggregator: LogicAggregatorNode,
};

export function OrchestratorEditor() {
  const logic = useOrchestratorLogic();

  const logicAggTypes: AggType[] = ["AND", "OR"];

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
        {/* SVG Gradients */}
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="anomaly-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="60%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
            <linearGradient id="logic-num-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient id="logic-bool-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>

        {/* Header */}
        <EditorHeader
          orchestratorName={logic.orchestrator?.name}
          id={logic.id}
          activeTab={logic.activeTab}
          onTabChange={logic.setActiveTab}
          onNavigateBack={() => logic.navigate("/orchestrators")}
          onTest={() => logic.setTestOpen(true)}
          onSave={logic.handleSave}
          onCommit={logic.handleCommitVersion}
        />

        <main className="flex-1 flex overflow-hidden relative">
          {logic.activeTab === "editor" ? (
            <>
              {/* Palette Sidebar */}
              <aside
                className={`border-r border-border/40 bg-card/20 backdrop-blur-sm transition-all duration-300 flex flex-col z-10 ${
                  logic.paletteOpen ? "w-64" : "w-0 overflow-hidden border-none"
                }`}
              >
                <div className="p-3 border-b border-border/40 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Node Library
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-6">
                  {/* ... Palette content ... */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground/70 ml-1">Inputs</p>
                    <PaletteItem
                      label="Feature Extractor"
                      sublabel="Extract raw data field"
                      badgeText="DATA"
                      badgeClass="text-violet-400 border-violet-500/30"
                      nodeType="featureExtractor"
                      nodeData={{ label: "New Feature", entityId: null, outputType: "Float" }}
                      iconNode={<Boxes className="h-4 w-4 text-violet-400" />}
                    />
                  </div>
                  {/* ... other palette items ... */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-medium text-muted-foreground/70 ml-1">Logic Gateways</p>
                    <div className="grid grid-cols-1 gap-2">
                      {logicAggTypes.map((type) => (
                        <PaletteItem
                          key={type}
                          label={`${type} Gate`}
                          sublabel="Boolean logic aggregator"
                          badgeText="LOGIC"
                          badgeClass="text-blue-400 border-blue-500/30"
                          nodeType="logicAggregator"
                          nodeData={{ label: `${type} Node`, aggType: type, allowedInputType: "BOOLEAN", outputType: "BOOLEAN" }}
                          iconNode={<AggSymbol symbol={type === "AND" ? "&" : "||"} color="#60a5fa" />}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Canvas Area */}
              <div className="flex-1 relative bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] bg-[size:24px_24px] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]">
                <ReactFlow
                  nodes={logic.nodes}
                  edges={logic.edges}
                  onNodesChange={logic.onNodesChange}
                  onEdgesChange={logic.onEdgesChange}
                  onConnect={logic.onConnect}
                  onInit={logic.setRfInstance}
                  onDrop={logic.onDrop}
                  onDragOver={logic.onDragOver}
                  onNodeClick={logic.onNodeClick}
                  nodeTypes={nodeTypes}
                  fitView
                  className="bg-transparent"
                >
                  <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
                  <Controls className="!bg-card !border-border/40 !shadow-xl" />
                  <MiniMap className="!bg-card !border-border/40 !shadow-xl rounded-lg overflow-hidden" zoomable pannable />
                  <Panel position="top-right" className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-card"
                      onClick={() => logic.setPaletteOpen(!logic.paletteOpen)}
                    >
                      {logic.paletteOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 bg-card"
                      onClick={() => logic.setPropertiesOpen(!logic.propertiesOpen)}
                    >
                      {logic.propertiesOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                  </Panel>
                </ReactFlow>
              </div>

              {/* Properties Sidebar */}
              <aside
                className={`border-l border-border/40 bg-card/20 backdrop-blur-sm transition-all duration-300 flex flex-col z-10 ${
                  logic.propertiesOpen ? "w-80" : "w-0 overflow-hidden border-none"
                }`}
              >
                <div className="p-3 border-b border-border/40 flex items-center justify-between shrink-0">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Node Properties
                  </span>
                </div>
                <PropertiesPanel
                  node={logic.selectedNode}
                  onScoreChange={logic.handleScoreChange}
                  onEntityBind={logic.handleEntityBind}
                  onMethodChange={logic.handleMethodChange}
                  validationMsg={logic.validationMsg}
                />
              </aside>
            </>
          ) : (
            <div className="flex-1 overflow-auto bg-muted/10 p-8">
              <DeploymentsView />
            </div>
          )}
        </main>

        <TestRunDialog
          nodes={logic.nodes}
          setNodes={logic.setNodes}
          open={logic.testOpen}
          onOpenChange={logic.setTestOpen}
        />
      </div>
    </TooltipProvider>
  );
}
