import {
  useCallback,
  useState,
  useRef,
  useEffect,
  type DragEvent,
} from "react";
import { useParams, useNavigate } from "react-router";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type ReactFlowInstance,
  BackgroundVariant,
  Panel,
  type Node as FlowNode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import { Slider } from "../components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  ArrowLeft,
  Play,
  Save,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Boxes,
  GitBranch,
  Brain,
  ShieldAlert,
  Zap,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  Network,
  Sigma,
  Code,
  Rocket,
} from "lucide-react";
import { FeatureExtractorNode } from "../components/orchestrator/FeatureExtractorNode";
import { RuleNode } from "../components/orchestrator/RuleNode";
import { ModelNode } from "../components/orchestrator/ModelNode";
import { AggregatorNode } from "../components/orchestrator/AggregatorNode";
import {
  LogicAggregatorNode,
  AGG_TYPE_CONFIG,
  type AggType,
} from "../components/orchestrator/LogicAggregatorNode";
import { DeploymentsView } from "../components/orchestrator/DeploymentsView";
import { useCombinedAppState, useSaveDraft, useCommitVersion, useDraft } from "../hooks/useMolenApi";
import { toast } from "sonner";

// ─── Constants ───────────────────────────────────────────────────────────────

const nodeTypes = {
  featureExtractor: FeatureExtractorNode,
  rule: RuleNode,
  model: ModelNode,
  aggregator: AggregatorNode,
  logicAggregator: LogicAggregatorNode,
};

const OUTPUT_TYPE_COLORS: Record<string, string> = {
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

interface NodeData extends Record<string, unknown> {
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

type MolenNode = FlowNode<NodeData>;

// Maps node outputType/DataType to a canonical DataType key for comparison
function getSourceDataType(node: MolenNode | undefined): string | null {
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

const DRAG_KEY = "application/molen-node";
let nodeIdCounter = 100;
const genId = () => `n${++nodeIdCounter}`;

// ─── Palette Item ─────────────────────────────────────────────────────────────

function PaletteItem({
  iconNode,
  label,
  sublabel,
  badgeText,
  badgeClass,
  nodeType,
  nodeData,
  accentClass = "",
}: {
  iconNode?: React.ReactNode;
  label: string;
  sublabel: string;
  badgeText: string;
  badgeClass: string;
  nodeType: string;
  nodeData: Record<string, any>;
  accentClass?: string;
}) {
  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData(DRAG_KEY, JSON.stringify({ nodeType, nodeData }));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`group flex items-center gap-2 rounded-lg border border-border/30 bg-card/40 px-2 py-1.5 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:bg-primary/5 transition-all select-none ${accentClass}`}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      {iconNode && (
        <div className="shrink-0">{iconNode}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate leading-tight">{label}</div>
        <div className="text-[9px] text-muted-foreground truncate leading-tight">{sublabel}</div>
      </div>
      <Badge variant="outline" className={`text-[8px] px-1 py-0 shrink-0 ${badgeClass}`}>
        {badgeText}
      </Badge>
    </div>
  );
}

// Symbol pill for aggregator palette items
function AggSymbol({
  symbol,
  color,
}: {
  symbol: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center justify-center rounded w-6 h-6 font-mono font-black text-sm shrink-0"
      style={{ background: `${color}18`, color, border: `1px solid ${color}50` }}
    >
      {symbol}
    </div>
  );
}

// ─── Properties Panel ─────────────────────────────────────────────────────────

interface ValidationMessage {
  type: "error" | "warning" | "ok";
  text: string;
}

function PropertiesPanel({
  node,
  onScoreChange,
  onEntityBind,
  onMethodChange,
  validationMsg,
}: {
  node: MolenNode | null;
  onScoreChange: (score: number) => void;
  onEntityBind: (entityType: string, entityId: string) => void;
  onMethodChange: (method: "avg" | "max" | "sum_cap") => void;
  validationMsg: ValidationMessage | null;
}) {
  const state = useCombinedAppState();

  if (!node) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
        <div className="rounded-full bg-muted/30 p-3">
          <Info className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">No node selected</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Click any node on the canvas to configure it
          </p>
        </div>
      </div>
    );
  }

  const scoreVal = node.data.anomalyScore ?? 100;
  const aggCfg = node.type === "logicAggregator"
    ? AGG_TYPE_CONFIG[node.data.aggType as AggType]
    : null;

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-4">
        {/* Node identity */}
        <Card className="border-border/40 bg-card/40">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">
              Node Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-foreground">{node.id}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Type</span>
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                {node.type}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Label</span>
              <span className="font-medium text-right max-w-[140px] truncate">
                {node.data.label}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Validation feedback */}
        {validationMsg && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
              validationMsg.type === "error"
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : validationMsg.type === "warning"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {validationMsg.type === "ok" ? (
              <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            )}
            <span>{validationMsg.text}</span>
          </div>
        )}

        {/* ── Feature Extractor ── */}
        {node.type === "featureExtractor" && (
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5 text-violet-400" />
                Field Binding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">Bind to Feature Extractor</label>
                <Select value={node.data.entityId ?? ""} onValueChange={(v) => onEntityBind("featureExtractor", v)}>
                  <SelectTrigger className="h-8 text-xs bg-input border-border/50">
                    <SelectValue placeholder="Select from registry…" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50">
                    {state.featureExtractors.map((ext) => (
                      <SelectItem key={ext.id} value={ext.id} className="text-xs">
                        <span>{ext.name}</span>
                        <Badge variant="outline" className={`ml-2 text-[9px] px-1 py-0 ${OUTPUT_TYPE_COLORS[ext.outputType] ?? ""}`}>
                          {ext.outputType}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {node.data.outputType && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Output DataType</span>
                  <Badge variant="outline" className={`text-[10px] ${OUTPUT_TYPE_COLORS[node.data.outputType] ?? ""}`}>
                    {node.data.outputType}
                  </Badge>
                </div>
              )}
              {node.data.path && (
                <div className="text-xs">
                  <span className="text-muted-foreground block mb-1">JSON Path</span>
                  <code className="text-[11px] font-mono bg-muted/40 px-2 py-1 rounded border border-border/30 block">
                    {node.data.path}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Rule ── */}
        {node.type === "rule" && (
          <>
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-orange-400" />
                  Rule Binding
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-muted-foreground">Bind to Rule Registry</label>
                  <Select value={node.data.entityId ?? ""} onValueChange={(v) => onEntityBind("rule", v)}>
                    <SelectTrigger className="h-8 text-xs bg-input border-border/50">
                      <SelectValue placeholder="Select rule…" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border/50">
                      {state.rules.map((r) => (
                        <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {node.data.condition && (
                  <div className="text-xs">
                    <span className="text-muted-foreground block mb-1">Condition</span>
                    <code className="text-[11px] font-mono bg-muted/40 px-2 py-1.5 rounded border border-border/30 block leading-relaxed">
                      {node.data.condition}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-red-400" />
                  Score Contribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">If true, contribute:</span>
                  <span className={`text-sm font-bold tabular-nums ${scoreVal >= 80 ? "text-red-400" : scoreVal >= 50 ? "text-orange-400" : "text-yellow-400"}`}>
                    {scoreVal}
                  </span>
                </div>
                <Slider
                  value={[scoreVal]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={([v]) => onScoreChange(v)}
                  className="[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-orange-500 [&_[data-slot=slider-range]]:to-red-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>0 · no impact</span>
                  <span>100 · full block</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Model ── */}
        {node.type === "model" && (
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-violet-400" />
                Model Binding
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">Bind to Model Registry</label>
                <Select value={node.data.entityId ?? ""} onValueChange={(v) => onEntityBind("model", v)}>
                  <SelectTrigger className="h-8 text-xs bg-input border-border/50">
                    <SelectValue placeholder="Select model…" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50">
                    {state.models.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.name} <span className="text-muted-foreground ml-1">{m.version}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator className="bg-border/30" />
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Output DataType</span>
                  <Badge variant="outline" className="border-orange-500/40 text-orange-400 bg-orange-500/10 text-[10px]">
                    ANOMALY_SCORE
                  </Badge>
                </div>
                {node.data.accuracy && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="text-emerald-400 font-medium">{node.data.accuracy}%</span>
                  </div>
                )}
                {node.data.version && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-mono">{node.data.version}</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
                Output is fixed to <code className="text-orange-400">DataType.ANOMALY_SCORE</code>. Score generated dynamically at runtime (0–100).
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Score Sink (aggregator) ── */}
        {node.type === "aggregator" && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                Aggregation Method
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              {(["avg", "max", "sum_cap"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onMethodChange(m)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs border transition-all ${
                    (node.data.method ?? "avg") === m
                      ? "border-red-500/60 bg-red-500/15 text-red-300 shadow-sm shadow-red-500/10"
                      : "border-border/40 bg-card/40 text-muted-foreground hover:bg-card/60 hover:border-border/60"
                  }`}
                >
                  <div className="font-medium mb-0.5">
                    {m === "avg" && "Average"}{m === "max" && "Maximum"}{m === "sum_cap" && "Sum (capped at 100)"}
                  </div>
                  <div className="text-[10px] opacity-70">
                    {m === "avg" && "Balanced · smooths out outlier spikes"}
                    {m === "max" && "Worst-case · escalates on any hit"}
                    {m === "sum_cap" && "Additive · accumulates all signals"}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── Logic Aggregator ── */}
        {node.type === "logicAggregator" && aggCfg && (
          <Card
            className="bg-card/40"
            style={{ borderColor: `${aggCfg.handleColor}40` }}
          >
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <span
                  className="font-mono font-black text-lg leading-none"
                  style={{ color: aggCfg.handleColor }}
                >
                  {aggCfg.symbol}
                </span>
                <span style={{ color: aggCfg.handleColor }}>
                  {aggCfg.label} Aggregator
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {aggCfg.desc}
              </p>

              <Separator className="bg-border/30" />

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <Badge variant="outline" className={`text-[10px] ${aggCfg.badgeTw}`}>
                    {aggCfg.category === "math" ? "Math" : "Logic"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Accepts</span>
                  <Badge variant="outline" className={`text-[10px] ${aggCfg.badgeTw}`}>
                    {aggCfg.allowedInputType}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Emits</span>
                  <Badge variant="outline" className={`text-[10px] ${aggCfg.badgeTw}`}>
                    {aggCfg.outputType}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cardinality</span>
                  <span className="font-mono text-muted-foreground">N → 1</span>
                </div>
              </div>

              <div
                className="rounded-md border p-2.5 text-[11px] text-muted-foreground leading-relaxed"
                style={{ borderColor: `${aggCfg.handleColor}30`, background: `${aggCfg.handleColor}08` }}
              >
                Connect multiple{" "}
                <code style={{ color: aggCfg.handleColor }}>{aggCfg.allowedInputType}</code>{" "}
                outputs into this node's N-ary socket. Incompatible types will be rejected with a validation error.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── Test Run Dialog ──────────────────────────────────────────────────────────

interface TestResult {
  aggregateScore: number;
  ruleScores: Array<{ name: string; score: number; triggered: boolean }>;
  modelScores: Array<{ name: string; score: number }>;
}

function TestRunDialog({
  nodes,
  setNodes,
  open,
  onOpenChange,
}: {
  nodes: MolenNode[];
  setNodes: (nds: MolenNode[] | ((prev: MolenNode[]) => MolenNode[])) => void;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleRun = () => {
    setIsRunning(true);
    setResult(null);
    setTimeout(() => {
      const ruleNodes = nodes.filter((n) => n.type === "rule");
      const modelNodes = nodes.filter((n) => n.type === "model");
      const ruleScores = ruleNodes.map((n) => {
        const triggered = Math.random() > 0.4;
        return { name: String(n.data.label), score: triggered ? Number(n.data.anomalyScore ?? 100) : 0, triggered };
      });
      const modelScores = modelNodes.map((n) => ({
        name: String(n.data.label),
        score: Math.round(30 + Math.random() * 65),
      }));
      const all = [...ruleScores.map((r) => r.score), ...modelScores.map((m) => m.score)];
      const agg = all.length > 0 ? Math.min(100, Math.round(all.reduce((a, b) => a + b, 0) / all.length)) : 0;

      setNodes((nds: MolenNode[]) =>
        nds.map((n) => {
          if (n.type === "rule") {
            const r = ruleScores.find((x) => x.name === n.data.label);
            return r ? { ...n, data: { ...n.data, triggered: r.triggered } } : n;
          }
          if (n.type === "model") {
            const m = modelScores.find((x) => x.name === n.data.label);
            return m ? { ...n, data: { ...n.data, runtimeScore: m.score } } : n;
          }
          if (n.type === "aggregator") {
            return { ...n, data: { ...n.data, aggregateScore: agg, contributorCount: ruleScores.filter((r) => r.triggered).length + modelScores.length } };
          }
          return n;
        })
      );
      setResult({ aggregateScore: agg, ruleScores, modelScores });
      setIsRunning(false);
    }, 1600);
  };

  const sc = (s: number) => s >= 80 ? "text-red-400" : s >= 50 ? "text-orange-400" : "text-emerald-400";
  const sb = (s: number) => s >= 80 ? "border-red-500/40 bg-red-500/10" : s >= 50 ? "border-orange-500/40 bg-orange-500/10" : "border-emerald-500/40 bg-emerald-500/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-popover border-border/50 max-w-md">
        <DialogHeader>
          <DialogTitle>Test Run</DialogTitle>
          <DialogDescription>Simulate the pipeline with a mock transaction payload</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Mock Transaction (JSON)</label>
            <Textarea
              defaultValue={`{\n  "amount": 7500,\n  "country": "US",\n  "ip": "192.168.1.1"\n}`}
              className="font-mono text-xs min-h-28 bg-input border-border/50 resize-none"
            />
          </div>
          <Button onClick={handleRun} disabled={isRunning} className="w-full bg-primary hover:bg-primary/90">
            <Play className="mr-2 h-4 w-4" />
            {isRunning ? "Evaluating pipeline…" : "Execute Test"}
          </Button>
          {result && (
            <div className="space-y-3">
              <div className={`rounded-lg border p-4 ${sb(result.aggregateScore)}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Aggregate Anomaly Score</span>
                  <span className={`text-3xl font-bold tabular-nums leading-none ${sc(result.aggregateScore)}`}>
                    {result.aggregateScore}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/ 100</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${result.aggregateScore}%`, background: "linear-gradient(to right,#6366f1,#8b5cf6,#c026d3,#dc2626)" }} />
                </div>
              </div>
              {result.ruleScores.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1"><Zap className="h-3 w-3" /> Rule Contributions</p>
                  {result.ruleScores.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md bg-card/60 border border-border/30">
                      <span className="text-muted-foreground truncate mr-2">{r.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.triggered && <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[9px] px-1.5 py-0">TRIGGERED</Badge>}
                        <span className={`font-bold tabular-nums ${r.triggered ? "text-red-400" : "text-muted-foreground"}`}>{r.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {result.modelScores.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1"><Brain className="h-3 w-3" /> Model Inferences</p>
                  {result.modelScores.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md bg-card/60 border border-border/30">
                      <span className="text-muted-foreground truncate mr-2">{m.name}</span>
                      <span className={`font-bold tabular-nums ${sc(m.score)}`}>{m.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function OrchestratorEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const state = useCombinedAppState();
  const { data: draft } = useDraft(id!);

  const orchestrator = state.orchestrators.find((o) => o.id === id) || draft;

  const [activeTab, setActiveTab] = useState("editor");
  const [nodes, setNodes, onNodesChange] = useNodesState<MolenNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<MolenNode, Edge> | null>(null);
  const [selectedNode, setSelectedNode] = useState<MolenNode | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [testOpen, setTestOpen] = useState(false);
  const [validationMsg, setValidationMsg] = useState<ValidationMessage | null>(null);
  const invalidEdgeRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const hasAggregator = nodes.some((n) => n.type === "aggregator");

  useEffect(() => {
    if (draft?.graph) {
      setNodes((draft.graph.nodes as unknown as MolenNode[]) || []);
      setEdges((draft.graph.edges as unknown as Edge[]) || []);
    }
  }, [draft, setNodes, setEdges]);

  const showValidation = (msg: ValidationMessage, durationMs = 4000) => {
    setValidationMsg(msg);
    setTimeout(() => setValidationMsg(null), durationMs);
  };

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      // ── Guard: aggregator has no outputs ──
      if (sourceNode?.type === "aggregator") {
        showValidation({ type: "error", text: "The Result Sink is a terminal node — it has no outputs." });
        return;
      }

      // ── Guard: feature extractor → score sink ──
      if (sourceNode?.type === "featureExtractor" && targetNode?.type === "aggregator") {
        showValidation({ type: "error", text: "Route Feature Extractors through a Rule or Model before the Result Sink." });
        return;
      }

      // ── Type validation for Logic Aggregator ──
      if (targetNode?.type === "logicAggregator") {
        const sourceType = getSourceDataType(sourceNode);
        const required = targetNode.data.allowedInputType as string;
        if (sourceType && sourceType !== required) {
          // Flash invalid edge
          const invalidId = `invalid-${Date.now()}`;
          invalidEdgeRef.current = invalidId;
          setEdges((eds) => [
            ...eds,
            {
              id: invalidId,
              source: params.source!,
              target: params.target!,
              animated: false,
              className: "invalid-edge",
              style: { stroke: "#ef4444", strokeWidth: 2.5 },
            } as Edge,
          ]);
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

        // Valid connection — use the aggregator's type-specific edge color
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

        // Increment connection count on target node
        setNodes((nds) =>
          nds.map((n) =>
            n.id === targetNode.id
              ? { ...n, data: { ...n.data, connectionCount: (n.data.connectionCount as number ?? 0) + 1 } }
              : n
          )
        );
        return;
      }

      // ── Default edge routing ──
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
    [nodes, setEdges, setNodes]
  );

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
      const position = rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: MolenNode = { 
        id: genId(), 
        type: nodeType, 
        position, 
        data: nodeData 
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [rfInstance, setNodes]
  );

  const addAggregator = () => {
    const position = rfInstance
      ? rfInstance.screenToFlowPosition({ x: window.innerWidth * 0.7, y: window.innerHeight * 0.4 })
      : { x: 800, y: 200 };
    const newNode: MolenNode = { 
      id: genId(), 
      type: "aggregator", 
      position, 
      data: { 
        label: "Aggregate Risk Score", 
        aggregateScore: 0, 
        method: "avg", 
        contributorCount: 0 
      } 
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const handleScoreChange = useCallback(
    (score: number) => {
      if (!selectedNode) return;
      setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, anomalyScore: score } } : n));
      setSelectedNode((prev: MolenNode | null) => prev ? { ...prev, data: { ...prev.data, anomalyScore: score } } : null);
    },
    [selectedNode, setNodes]
  );

  const handleEntityBind = useCallback(
    (entityType: string, entityId: string) => {
      if (!selectedNode) return;
      let extra: Partial<NodeData> = { entityId };
      if (entityType === "featureExtractor") {
        const ext = state.featureExtractors.find((e) => e.id === entityId);
        if (ext) extra = { entityId, label: ext.name, outputType: ext.outputType, path: ext.sourceField };
      } else if (entityType === "rule") {
        const rule = state.rules.find((r) => r.id === entityId);
        if (rule) extra = { entityId, label: rule.name, condition: rule.condition, anomalyScore: rule.anomalyScore ?? 100 };
      } else if (entityType === "model") {
        const model = state.models.find((m) => m.id === entityId);
        if (model) extra = { entityId, label: model.name, version: 'v1.0', accuracy: 95, outputType: 'ANOMALY_SCORE' };
      }
      setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...extra } } : n));
      setSelectedNode((prev: MolenNode | null) => prev ? { ...prev, data: { ...prev.data, ...extra } } : null);
      toast.success("Node bound to registry entity");
    },
    [selectedNode, setNodes, state]
  );

  const handleMethodChange = useCallback(
    (method: "avg" | "max" | "sum_cap") => {
      if (!selectedNode) return;
      setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, method } } : n));
      setSelectedNode((prev: MolenNode | null) => prev ? { ...prev, data: { ...prev.data, method } } : null);
    },
    [selectedNode, setNodes]
  );

  const saveDraft = useSaveDraft();
  const commitVersion = useCommitVersion();

  const handleSave = () => {
    const currentNodes = rfInstance ? rfInstance.getNodes() : nodes;
    const currentEdges = rfInstance ? rfInstance.getEdges() : edges;
    
    console.log("SAVING DRAFT", { currentNodes, currentEdges });

    saveDraft.mutate({
      id: id!,
      name: orchestrator?.name ?? "New Orchestrator",
      graph: { nodes: currentNodes as any, edges: currentEdges as any },
      updatedAt: new Date()
    }, {
      onSuccess: () => {
        toast.success("Orchestrator saved", { description: `${currentNodes.length} nodes · ${currentEdges.length} edges` });
      },
      onError: (err) => {
        toast.error("Failed to save orchestrator", { description: err.message });
      }
    });
  };

  const handleCommitVersion = () => {
    if (!id) return;
    
    const currentNodes = rfInstance ? rfInstance.getNodes() : nodes;
    const currentEdges = rfInstance ? rfInstance.getEdges() : edges;
    
    console.log("COMMITTING VERSION", { currentNodes, currentEdges });

    // Auto-save before committing to ensure latest graph is used
    saveDraft.mutate({
      id: id!,
      name: orchestrator?.name ?? "New Orchestrator",
      graph: { nodes: currentNodes as any, edges: currentEdges as any },
      updatedAt: new Date()
    }, {
      onSuccess: () => {
        commitVersion.mutate(id, {
          onSuccess: (version) => {
            toast.success("Version committed", {
              description: `v${version.version} created as an immutable snapshot`,
            });
          },
          onError: (err) => {
            toast.error("Failed to commit version", { description: err.message });
          }
        });
      },
      onError: (err) => {
        toast.error("Failed to save draft before commit", { description: err.message });
      }
    });
  };

  // Palette aggregator items
  const mathAggTypes: AggType[] = ["SUM", "MAX", "MIN", "AVG"];
  const logicAggTypes: AggType[] = ["AND", "OR"];

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        {/* SVG gradient defs + animation */}
        <svg style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
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
            {/* Logic/Math aggregator edge gradients */}
            <linearGradient id="logic-num-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient id="logic-bool-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Top toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 bg-sidebar/60 backdrop-blur shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/orchestrator")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Orchestrators</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5 bg-border/40" />

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="rounded-md bg-primary/15 border border-primary/20 p-1">
              <Network className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                <span>Orchestrators</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium truncate">{orchestrator?.name ?? "High-Value Check"}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-primary">{activeTab === "editor" ? "Editor" : "Deployments"}</span>
              </div>
              <div className="flex items-center gap-2">
                {activeTab === "editor" && (
                  <>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-[9px] px-1.5 py-0">
                      Unsaved Changes
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{nodes.length} nodes · {edges.length} edges</span>
                  </>
                )}
                {orchestrator && activeTab === "deployments" && (
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                    orchestrator.status === "active" ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                      : orchestrator.status === "testing" ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                      : "border-slate-500/40 text-slate-400 bg-slate-500/10"
                  }`}>
                    {orchestrator.status}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Legend - only show on editor tab */}
          {activeTab === "editor" && (
            <div className="hidden xl:flex items-center gap-3 text-[10px] text-muted-foreground bg-card/40 border border-border/30 rounded-lg px-3 py-1.5 shrink-0">
              {[
                { label: "Feature", grad: "linear-gradient(to right,#6366f1,#8b5cf6)" },
                { label: "Anomaly", grad: "linear-gradient(to right,#f97316,#dc2626)" },
                { label: "Number", grad: "linear-gradient(to right,#16a34a,#22c55e)" },
                { label: "Boolean", grad: "linear-gradient(to right,#7e22ce,#a855f7)" },
              ].map(({ label, grad }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-5 h-0.5 rounded-full inline-block" style={{ background: grad }} />
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Actions - different per tab */}
          <div className="flex items-center gap-2 shrink-0">
            {activeTab === "editor" ? (
              <>
                <Button variant="outline" size="sm" className="h-8 border-border/50 text-xs gap-1.5" onClick={handleSave}>
                  <Save className="h-3.5 w-3.5" />Save Draft
                </Button>
                <Button variant="outline" size="sm" className="h-8 border-border/50 text-xs gap-1.5" onClick={() => setTestOpen(true)}>
                  <Play className="h-3.5 w-3.5" />Test Run
                </Button>
                <Button size="sm" className="h-8 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs gap-1.5" onClick={handleCommitVersion}>
                  <GitBranch className="h-3.5 w-3.5" />Commit Version
                </Button>
              </>
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <Rocket className="h-3.5 w-3.5" />
                Deployment Control Center
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
          <div className="border-b border-border/30 bg-sidebar/40 px-4 shrink-0">
            <TabsList className="bg-transparent h-9 p-0 gap-1">
              <TabsTrigger
                value="editor"
                className="data-[state=active]:bg-card/60 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none text-xs gap-1.5 px-3"
              >
                <Code className="h-3.5 w-3.5" />
                Editor
              </TabsTrigger>
              <TabsTrigger
                value="deployments"
                className="data-[state=active]:bg-card/60 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-b-none text-xs gap-1.5 px-3"
              >
                <Rocket className="h-3.5 w-3.5" />
                Deployments
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Editor Tab Content */}
          <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
            <div className="flex flex-1 h-full overflow-hidden">

          {/* ── LEFT: Palette ─────────────────────────────────────────── */}
          <div className={`border-r border-border/40 bg-sidebar/60 flex flex-col transition-all duration-300 shrink-0 overflow-hidden ${paletteOpen ? "w-60" : "w-0"}`}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Palette</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPaletteOpen(false)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 space-y-4">

                {/* Feature Extractors */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-1 mb-1.5">
                    <Boxes className="h-3 w-3 text-violet-400" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Extractors</span>
                  </div>
                  {state.featureExtractors.map((ext) => (
                    <PaletteItem
                      key={ext.id}
                      iconNode={<div className="rounded bg-violet-500/15 p-1"><Boxes className="h-3 w-3 text-violet-400" /></div>}
                      label={ext.name}
                      sublabel={ext.sourceField}
                      badgeText={ext.outputType}
                      badgeClass={OUTPUT_TYPE_COLORS[ext.outputType] ?? "border-border text-muted-foreground"}
                      nodeType="featureExtractor"
                      nodeData={{ label: ext.name, outputType: ext.outputType, path: ext.sourceField, entityId: ext.id }}
                    />
                  ))}
                </div>

                <Separator className="bg-border/30" />

                {/* Typed Rules */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-1 mb-1.5">
                    <GitBranch className="h-3 w-3 text-orange-400" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Typed Rules</span>
                  </div>
                  {state.rules.map((rule) => (
                    <PaletteItem
                      key={rule.id}
                      iconNode={<div className="rounded bg-orange-500/15 p-1"><GitBranch className="h-3 w-3 text-orange-400" /></div>}
                      label={rule.name}
                      sublabel={rule.condition}
                      badgeText={`${rule.anomalyScore ?? 100}`}
                      badgeClass="border-orange-500/40 text-orange-400 bg-orange-500/10"
                      nodeType="rule"
                      nodeData={{ label: rule.name, condition: rule.condition, action: rule.action, anomalyScore: rule.anomalyScore ?? 100, triggered: false, entityId: rule.id }}
                    />
                  ))}
                </div>

                <Separator className="bg-border/30" />

                {/* ML Models */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-1 mb-1.5">
                    <Brain className="h-3 w-3 text-violet-400" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">ML Models</span>
                  </div>
                  {state.models.map((model) => (
                    <PaletteItem
                      key={model.id}
                      iconNode={<div className="rounded bg-violet-500/15 p-1"><Brain className="h-3 w-3 text-violet-400" /></div>}
                      label={model.name}
                      sublabel={model.modelUrl}
                      badgeText="SCORE"
                      badgeClass="border-orange-500/40 text-orange-400 bg-orange-500/10"
                      nodeType="model"
                      nodeData={{ label: model.name, version: 'v1.0', accuracy: 95, outputType: 'ANOMALY_SCORE', runtimeScore: 74, entityId: model.id }}
                    />
                  ))}
                </div>

                <Separator className="bg-border/30" />

                {/* ── Aggregators ── */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 px-1">
                    <Sigma className="h-3 w-3 text-green-400" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Aggregators</span>
                  </div>

                  {/* Math sub-group */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">Math</span>
                      <div className="flex-1 h-px bg-border/30" />
                    </div>
                    {mathAggTypes.map((aType) => {
                      const cfg = AGG_TYPE_CONFIG[aType];
                      return (
                        <PaletteItem
                          key={aType}
                          iconNode={<AggSymbol symbol={cfg.symbol} color={cfg.handleColor} />}
                          label={cfg.label}
                          sublabel={cfg.desc}
                          badgeText="NUMBER"
                          badgeClass="border-green-500/40 text-green-400 bg-green-500/10"
                          nodeType="logicAggregator"
                          nodeData={{ label: `${cfg.label} Aggregator`, aggType: aType, allowedInputType: cfg.allowedInputType, outputType: cfg.outputType, connectionCount: 0 }}
                        />
                      );
                    })}
                  </div>

                  {/* Logic sub-group */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">Logic</span>
                      <div className="flex-1 h-px bg-border/30" />
                    </div>
                    {logicAggTypes.map((aType) => {
                      const cfg = AGG_TYPE_CONFIG[aType];
                      return (
                        <PaletteItem
                          key={aType}
                          iconNode={<AggSymbol symbol={cfg.symbol} color={cfg.handleColor} />}
                          label={cfg.label}
                          sublabel={cfg.desc}
                          badgeText="BOOLEAN"
                          badgeClass="border-purple-500/40 text-purple-400 bg-purple-500/10"
                          nodeType="logicAggregator"
                          nodeData={{ label: `${cfg.label} Aggregator`, aggType: aType, allowedInputType: cfg.allowedInputType, outputType: cfg.outputType, connectionCount: 0 }}
                        />
                      );
                    })}
                  </div>
                </div>

                <Separator className="bg-border/30" />

                {/* Output / Score Sink */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 px-1 mb-1.5">
                    <ShieldAlert className="h-3 w-3 text-red-400" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Output</span>
                  </div>
                  <div className={hasAggregator ? "opacity-40 pointer-events-none" : ""}>
                    <PaletteItem
                      iconNode={<div className="rounded bg-red-500/15 p-1"><ShieldAlert className="h-3 w-3 text-red-400" /></div>}
                      label="Score Sink"
                      sublabel="Aggregate Anomaly Score"
                      badgeText="SINK"
                      badgeClass="border-red-500/40 text-red-400 bg-red-500/10"
                      nodeType="aggregator"
                      nodeData={{ label: "Aggregate Risk Score", aggregateScore: 0, method: "avg", contributorCount: 0 }}
                    />
                  </div>
                  {hasAggregator && (
                    <p className="text-[9px] text-muted-foreground/60 px-1">A Score Sink already exists on the canvas.</p>
                  )}
                </div>

              </div>
            </ScrollArea>

            {!hasAggregator && (
              <div className="p-3 border-t border-border/30 shrink-0">
                <Button variant="outline" size="sm" className="w-full h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 gap-1.5" onClick={addAggregator}>
                  <Plus className="h-3.5 w-3.5" />Add Score Sink
                </Button>
              </div>
            )}
          </div>

          {!paletteOpen && (
            <div className="flex flex-col items-center justify-center w-9 border-r border-border/40 bg-sidebar/40 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPaletteOpen(true)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── CENTER: Canvas ─────────────────────────────────────────── */}
          <div className="flex-1 relative" ref={canvasRef} onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={setRfInstance}
              onPaneClick={() => setSelectedNode(null)}
              nodeTypes={nodeTypes}
              fitView
              className="bg-background"
              deleteKeyCode="Delete"
            >
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
              <Controls className="bg-card/90 border-border/50 shadow-lg" />
              <MiniMap
                className="bg-card/90 border-border/50 shadow-lg"
                nodeColor={(n: MolenNode) =>
                  n.type === "aggregator" ? "#ef4444"
                    : n.type === "rule" ? "#f97316"
                    : n.type === "model" ? "#8b5cf6"
                    : n.type === "logicAggregator"
                    ? (n.data?.aggType && AGG_TYPE_CONFIG[n.data.aggType as AggType]?.handleColor) || "#22c55e"
                    : "#6366f1"
                }
                maskColor="rgba(2,6,23,0.85)"
              />
              <Panel position="top-left">
                <div className="flex items-center gap-1.5 bg-card/80 backdrop-blur border border-border/40 rounded-lg px-2.5 py-1.5 text-[10px] text-muted-foreground shadow-sm">
                  <Info className="h-3 w-3" />
                  Drag from palette · Delete removes selected
                </div>
              </Panel>
            </ReactFlow>
          </div>

          {!propertiesOpen && (
            <div className="flex flex-col items-center justify-center w-9 border-l border-border/40 bg-sidebar/40 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPropertiesOpen(true)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── RIGHT: Properties ──────────────────────────────────────── */}
          <div className={`border-l border-border/40 bg-sidebar/60 flex flex-col transition-all duration-300 shrink-0 overflow-hidden ${propertiesOpen ? "w-72" : "w-0"}`}>
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Properties</span>
                {selectedNode && (
                  <Badge variant="outline" className="border-primary/40 text-primary text-[9px] px-1.5 py-0">
                    {selectedNode.type}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                {selectedNode && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPropertiesOpen(false)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <PropertiesPanel
              node={selectedNode}
              onScoreChange={handleScoreChange}
              onEntityBind={handleEntityBind}
              onMethodChange={handleMethodChange}
              validationMsg={validationMsg}
            />
          </div>
            </div>
          </TabsContent>

          {/* Deployments Tab Content */}
          <TabsContent value="deployments" className="flex-1 m-0 overflow-hidden">
            <DeploymentsView />
          </TabsContent>
        </Tabs>

        <TestRunDialog nodes={nodes} setNodes={setNodes} open={testOpen} onOpenChange={setTestOpen} />
      </div>
    </TooltipProvider>
  );
}
