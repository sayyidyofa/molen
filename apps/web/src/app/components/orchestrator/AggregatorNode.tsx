import { Handle, Position } from "@xyflow/react";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { ShieldAlert, TrendingUp } from "lucide-react";

interface AggregatorNodeProps {
  data: {
    label: string;
    aggregateScore?: number;
    method?: "avg" | "max" | "sum_cap";
    contributorCount?: number;
  };
}

function RiskMeter({ score }: { score: number }) {
  const segments = [
    { label: "LOW", range: [0, 33], color: "#22c55e" },
    { label: "MED", range: [34, 66], color: "#f59e0b" },
    { label: "HIGH", range: [67, 100], color: "#ef4444" },
  ];

  const activeSegment = segments.find(
    (s) => score >= s.range[0] && score <= s.range[1]
  ) ?? segments[2];

  const ringColor =
    score >= 67
      ? "#ef4444"
      : score >= 34
      ? "#f59e0b"
      : "#22c55e";

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Ring with score */}
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 80,
          height: 80,
          background: `conic-gradient(${ringColor} ${score * 3.6}deg, rgba(30,41,59,0.8) 0deg)`,
          padding: 4,
        }}
      >
        <div
          className="flex flex-col items-center justify-center rounded-full bg-[#080d1a] w-full h-full"
          style={{ boxShadow: `inset 0 0 12px rgba(0,0,0,0.5)` }}
        >
          <span
            className="text-xl font-bold tabular-nums leading-none"
            style={{ color: ringColor }}
          >
            {score}
          </span>
          <span className="text-[9px] text-muted-foreground leading-none mt-0.5">/ 100</span>
        </div>
      </div>

      {/* Risk label */}
      <Badge
        className="text-[10px] px-2 py-0.5 border"
        style={{
          background: `${activeSegment.color}20`,
          color: activeSegment.color,
          borderColor: `${activeSegment.color}50`,
        }}
      >
        {activeSegment.label} RISK
      </Badge>
    </div>
  );
}

export function AggregatorNode({ data }: AggregatorNodeProps) {
  const score = data.aggregateScore ?? 0;
  const method = data.method ?? "avg";
  const contributors = data.contributorCount ?? 0;

  const methodLabel = { avg: "Average", max: "Maximum", sum_cap: "Sum (cap 100)" }[method];

  const glowColor =
    score >= 67
      ? "rgba(239,68,68,0.4)"
      : score >= 34
      ? "rgba(245,158,11,0.3)"
      : "rgba(34,197,94,0.2)";

  const borderColor =
    score >= 67
      ? "border-red-500/60"
      : score >= 34
      ? "border-amber-500/50"
      : "border-green-500/40";

  return (
    <Card
      className={`w-72 bg-[#080d1a]/98 backdrop-blur ${borderColor}`}
      style={{ boxShadow: `0 0 30px 6px ${glowColor}, 0 0 60px 10px ${glowColor}40` }}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-gradient-to-br from-orange-500/20 to-red-500/20 p-1.5 border border-orange-500/30">
            <ShieldAlert className="h-4 w-4 text-orange-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              {data.label}
            </div>
            <div className="text-xs text-muted-foreground">Result Sink · ANOMALY_SCORE</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-1 space-y-3">
        {/* Meter */}
        <div className="flex justify-center py-1">
          <RiskMeter score={score} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-2">
            <div className="text-muted-foreground text-[10px] mb-0.5">Method</div>
            <div className="font-medium text-foreground text-[11px]">{methodLabel}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/40 rounded-lg p-2">
            <div className="text-muted-foreground text-[10px] mb-0.5">Contributors</div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-orange-400" />
              <span className="font-medium text-foreground text-[11px]">{contributors} nodes</span>
            </div>
          </div>
        </div>

        {/* Molen wrap intensity bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Risk Intensity</span>
            <span className="text-orange-400/80">Neon Indigo → Violet → Deep Red</span>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden bg-slate-800">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${score}%`,
                background:
                  "linear-gradient(to right, #6366f1, #8b5cf6, #c026d3, #dc2626)",
              }}
            />
          </div>
        </div>
      </CardContent>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-4 !h-4 !bg-gradient-to-br from-orange-500 to-red-500 !border-2 !border-orange-400/70"
        style={{ boxShadow: "0 0 10px rgba(249,115,22,0.8)" }}
      />
    </Card>
  );
}
