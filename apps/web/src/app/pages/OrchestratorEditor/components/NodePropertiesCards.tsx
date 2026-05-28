import {
  Boxes,
  GitBranch,
  Brain,
  Sigma,
} from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Slider } from "../../../components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { FeatureExtractor, Rule, MLModel } from "@molen/shared-types";
import { type MolenNode, OUTPUT_TYPE_COLORS } from "../types";

interface NodeCardProps {
  node: MolenNode;
  state: {
    featureExtractors: FeatureExtractor[];
    rules: Rule[];
    models: MLModel[];
  };
  onEntityBind: (type: string, id: string) => void;
}

export function FeatureExtractorCard({ node, state, onEntityBind }: NodeCardProps) {
  return (
    <Card className="border-violet-500/20 bg-violet-500/5">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <Boxes className="h-3.5 w-3.5 text-violet-400" /> Field Binding
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground">Bind to Feature Extractor</label>
          <Select value={node.data.entityId ?? ""} onValueChange={(v) => onEntityBind("featureExtractor", v)}>
            <SelectTrigger className="h-8 text-xs bg-input border-border/50"><SelectValue placeholder="Select from registry…" /></SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              {state.featureExtractors.map((ext) => (
                <SelectItem key={ext.id} value={ext.id} className="text-xs">
                  <span>{ext.name}</span>
                  <Badge variant="outline" className={`ml-2 text-[9px] px-1 py-0 ${OUTPUT_TYPE_COLORS[ext.outputType] ?? ""}`}>{ext.outputType}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export function RuleCard({ node, state, onEntityBind }: NodeCardProps) {
  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5 text-amber-400" /> Rule Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground">Bind to Rule</label>
          <Select value={node.data.entityId ?? ""} onValueChange={(v) => onEntityBind("rule", v)}>
            <SelectTrigger className="h-8 text-xs bg-input border-border/50"><SelectValue placeholder="Select from registry…" /></SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              {state.rules.map((rule) => (
                <SelectItem key={rule.id} value={rule.id} className="text-xs"><span>{rule.name}</span></SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export function ModelCard({ node, state, onEntityBind }: NodeCardProps) {
  return (
    <Card className="border-indigo-500/20 bg-indigo-500/5">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <Brain className="h-3.5 w-3.5 text-indigo-400" /> ML Model Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[11px] text-muted-foreground">Bind to Model</label>
          <Select value={node.data.entityId ?? ""} onValueChange={(v) => onEntityBind("model", v)}>
            <SelectTrigger className="h-8 text-xs bg-input border-border/50"><SelectValue placeholder="Select from registry…" /></SelectTrigger>
            <SelectContent className="bg-popover border-border/50">
              {state.models.map((model) => (
                <SelectItem key={model.id} value={model.id} className="text-xs">
                  <span>{model.name}</span>
                  <Badge variant="outline" className="ml-2 text-[9px] px-1 py-0">v{model.version}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoreWeightCard({ node, onScoreChange }: { node: MolenNode, onScoreChange: (s: number) => void }) {
  const scoreVal = node.data.anomalyScore ?? 100;
  return (
    <Card className="border-border/20 bg-muted/10">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-xs flex items-center gap-1.5">
          <Sigma className="h-3.5 w-3.5 text-muted-foreground" /> Contribution Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[11px] text-muted-foreground">Anomaly Weight</label>
            <span className="font-mono text-[11px] text-primary font-bold">{scoreVal}%</span>
          </div>
          <Slider value={[scoreVal]} min={0} max={100} step={5} onValueChange={(vals) => onScoreChange(vals[0])} className="py-2" />
          <p className="text-[9px] text-muted-foreground/60 leading-relaxed italic">Defines how much this node contributes to its parent aggregator's final score.</p>
        </div>
      </CardContent>
    </Card>
  );
}
