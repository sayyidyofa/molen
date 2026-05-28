import {
  Info,
  CheckCircle,
  AlertTriangle,
  Network,
  Sigma,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { ScrollArea } from "../../../components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import {
  AGG_TYPE_CONFIG,
  type AggType,
} from "../../../components/orchestrator/LogicAggregatorNode";
import { useCombinedAppState } from "../../../hooks/useMolenApi";
import { type MolenNode, type ValidationMessage } from "../types";
import { 
  FeatureExtractorCard, 
  RuleCard, 
  ModelCard, 
  ScoreWeightCard 
} from "./NodePropertiesCards";

export function PropertiesPanel({
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
          <FeatureExtractorCard node={node} state={state} onEntityBind={onEntityBind} />
        )}

        {/* ── Rule ── */}
        {node.type === "rule" && (
          <RuleCard node={node} state={state} onEntityBind={onEntityBind} />
        )}

        {/* ── Model ── */}
        {node.type === "model" && (
          <ModelCard node={node} state={state} onEntityBind={onEntityBind} />
        )}

        {/* ── Logic Aggregator ── */}
        {node.type === "logicAggregator" && aggCfg && (
          <Card className="border-cyan-500/20 bg-cyan-500/5">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-cyan-400" />
                Logic Operation: {aggCfg.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-3 text-[11px]">
              <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-2 text-cyan-200/70 italic leading-relaxed">
                {aggCfg.desc}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Aggregator (Traditional) ── */}
        {node.type === "aggregator" && (
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Sigma className="h-3.5 w-3.5 text-emerald-400" />
                Aggregation Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground">Aggregation Method</label>
                <Select
                  value={node.data.method ?? "avg"}
                  onValueChange={(v) => onMethodChange(v as "avg" | "max" | "sum_cap")}
                >
                  <SelectTrigger className="h-8 text-xs bg-input border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/50">
                    <SelectItem value="avg" className="text-xs">Average (Mean)</SelectItem>
                    <SelectItem value="max" className="text-xs">Maximum (Peak)</SelectItem>
                    <SelectItem value="sum_cap" className="text-xs">Summed (Capped at 1.0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Score Weights (Shared for most) ── */}
        {(node.type === "rule" || node.type === "model" || node.type === "featureExtractor") && (
          <ScoreWeightCard node={node} onScoreChange={onScoreChange} />
        )}
      </div>
    </ScrollArea>
  );
}
