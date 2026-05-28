import * as React from "react";
import { Card, CardContent } from "../../../components/ui/card";

export function formatDate(iso: string | Date) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function LatencyBadge({ ms }: { ms: string | number }) {
  if (ms === "—")
    return <span className="text-muted-foreground text-sm">—</span>;
  const val = typeof ms === 'string' ? parseInt(ms) : ms;
  const color =
    val < 25 ? "text-emerald-400" : val < 40 ? "text-amber-400" : "text-orange-400";
  return (
    <span className={`font-mono text-sm tabular-nums font-medium ${color}`}>
      {ms}
    </span>
  );
}

export function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card className="border-border/40 bg-card/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
