import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { GitBranch, Zap } from "lucide-react";

interface RuleNodeProps {
  data: {
    label: string;
    condition: string;
    action: "PASS" | "FLAG" | "BLOCK";
    anomalyScore?: number;
    triggered?: boolean;
  };
}

export function RuleNode({ data }: RuleNodeProps) {
  const score = data.anomalyScore ?? 100;
  const triggered = data.triggered ?? false;

  const scoreColor =
    score >= 80
      ? "text-red-400"
      : score >= 50
      ? "text-orange-400"
      : "text-yellow-400";

  const scoreBg =
    score >= 80
      ? "bg-red-500/15"
      : score >= 50
      ? "bg-orange-500/15"
      : "bg-yellow-500/15";

  const scoreBorder =
    score >= 80
      ? "border-red-500/60"
      : score >= 50
      ? "border-orange-500/60"
      : "border-yellow-500/60";

  const triggeredGlow = triggered
    ? "shadow-[0_0_20px_4px_rgba(239,68,68,0.45)] border-red-500"
    : `border-slate-700/60`;

  return (
    <Card
      className={`w-64 bg-[#0a0f1e]/95 backdrop-blur transition-all duration-300 ${triggeredGlow}`}
    >
      {triggered && (
        <div className="absolute inset-0 rounded-xl bg-red-500/5 pointer-events-none" />
      )}

      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div
            className={`rounded-md p-1.5 ${triggered ? "bg-red-500/25" : "bg-indigo-500/15"}`}
          >
            <GitBranch
              className={`h-4 w-4 ${triggered ? "text-red-400" : "text-indigo-400"}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label}</div>
            <div className="text-xs text-muted-foreground">Rule Node</div>
          </div>
          {triggered && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-xs px-1.5 shrink-0">
              TRIGGERED
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-2">
        <div className="text-xs">
          <div className="text-muted-foreground mb-1">Condition</div>
          <div className="font-mono text-xs bg-slate-900/60 border border-slate-700/40 p-2 rounded-md">
            {data.condition}
          </div>
        </div>

        {/* Anomaly Score badge — prominent */}
        <div
          className={`flex items-center justify-between px-2.5 py-2 rounded-lg border ${scoreBg} ${scoreBorder}`}
        >
          <div className="flex items-center gap-1.5">
            <Zap className={`h-3.5 w-3.5 ${scoreColor}`} />
            <span className="text-xs text-muted-foreground">Anomaly Score</span>
          </div>
          <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>
            {score}
          </span>
        </div>

        {/* Score bar */}
        <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              score >= 80
                ? "bg-gradient-to-r from-orange-500 to-red-500"
                : score >= 50
                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                : "bg-gradient-to-r from-yellow-400 to-yellow-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardContent>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-indigo-400/50"
      />
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3.5 !h-3.5 !border-2 ${
          triggered
            ? "!bg-red-500 !border-red-400/70"
            : "!bg-orange-500 !border-orange-400/70"
        }`}
        style={{ boxShadow: triggered ? "0 0 8px rgba(239,68,68,0.8)" : "0 0 6px rgba(249,115,22,0.6)" }}
      />
    </Card>
  );
}
