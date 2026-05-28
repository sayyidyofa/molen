import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Activity, Server, Zap } from "lucide-react";

interface EnvironmentCardProps {
  environment: "Development" | "Staging" | "Production";
  activeVersion: string;
  throughput: number;
  isHealthy: boolean;
  onManage: () => void;
}

export function EnvironmentCard({
  environment,
  activeVersion,
  throughput,
  isHealthy,
  onManage,
}: EnvironmentCardProps) {
  const envColors = {
    Development: "border-cyan-500/30 bg-cyan-500/5",
    Staging: "border-amber-500/30 bg-amber-500/5",
    Production: "border-red-500/30 bg-red-500/5",
  };

  const envBadge = {
    Development: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
    Staging: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    Production: "border-red-500/40 text-red-400 bg-red-500/10",
  };

  return (
    <Card className={`${envColors[environment]} border-2 backdrop-blur`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4" />
              {environment}
            </CardTitle>
            <Badge variant="outline" className={`${envBadge[environment]} text-[10px] px-2 py-0.5`}>
              {activeVersion}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                isHealthy ? "bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className={`text-xs ${isHealthy ? "text-emerald-400" : "text-red-400"}`}>
              {isHealthy ? "Healthy" : "Down"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              Engine Status
            </span>
            <span className="text-emerald-400 font-medium">
              Connected to Redpanda
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Throughput
            </span>
            <span className="font-mono font-medium">
              {throughput.toLocaleString()} <span className="text-muted-foreground text-[10px]">TPS</span>
            </span>
          </div>
        </div>

        {/* Mini sparkline visualization */}
        <div className="h-8 flex items-end gap-0.5 opacity-60">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              // eslint-disable-next-line @eslint-react/no-array-index-key
              key={`sparkline-${i}`}
              className="flex-1 bg-gradient-to-t from-primary/60 to-primary/20 rounded-sm"
              style={{
                height: `${Math.random() * 60 + 40}%`,
              }}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs border-border/50 hover:bg-primary/10 hover:border-primary/40"
          onClick={onManage}
        >
          Manage Deployment
        </Button>
      </CardContent>
    </Card>
  );
}
