import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Brain, Activity } from "lucide-react";

interface ModelNodeProps {
  data: {
    label: string;
    version: string;
    accuracy: number;
    output: string;
    runtimeScore?: number;
  };
}

function MiniGauge({ value, accuracy }: { value: number; accuracy: number }) {
  const radius = 22;
  const circumference = Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width="56" height="32" viewBox="0 0 56 36">
          {/* Track */}
          <path
            d="M 6 34 A 22 22 0 0 1 50 34"
            fill="none"
            stroke="rgba(51,65,85,0.8)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Fill */}
          <path
            d="M 6 34 A 22 22 0 0 1 50 34"
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span className="text-xs font-bold text-orange-400 tabular-nums leading-none">
            {value}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Activity className="h-2.5 w-2.5 text-orange-400/70" />
        <span className="text-[10px] text-muted-foreground">acc {accuracy}%</span>
      </div>
    </div>
  );
}

export function ModelNode({ data }: ModelNodeProps) {
  const runtimeScore = data.runtimeScore ?? Math.round(data.accuracy * 0.75);

  return (
    <Card className="w-64 border-violet-500/40 bg-[#0a0f1e]/95 backdrop-blur shadow-lg shadow-violet-500/10">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-violet-500/20 p-1.5">
            <Brain className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{data.label}</div>
            <div className="text-xs text-muted-foreground">Model Node</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-2">
        {/* Mini gauge + version row */}
        <div className="flex items-center justify-between">
          <MiniGauge value={runtimeScore} accuracy={data.accuracy} />
          <div className="text-right space-y-1.5">
            <div className="text-xs text-muted-foreground">Version</div>
            <div className="text-xs font-mono text-foreground">{data.version}</div>
          </div>
        </div>

        {/* ANOMALY_SCORE output type */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/40">
          <span className="text-muted-foreground">Output Type</span>
          <Badge
            variant="outline"
            className="border-orange-500/50 text-orange-400 bg-orange-500/10 text-[10px] px-1.5 py-0"
          >
            ANOMALY_SCORE
          </Badge>
        </div>

        {/* Score bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Runtime Score Range</span>
            <span className="text-orange-400">0–{runtimeScore}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
              style={{ width: `${runtimeScore}%` }}
            />
          </div>
        </div>
      </CardContent>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-violet-500 !border-2 !border-violet-400/50"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-orange-500 !border-2 !border-orange-400/70"
        style={{ boxShadow: "0 0 8px rgba(249,115,22,0.7)" }}
      />
    </Card>
  );
}
