import { useState } from "react";
import { Play, Rocket, Zap, Brain, GitBranch } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { type MolenNode } from "../types";

interface TestResult {
  aggregateScore: number;
  ruleScores: Array<{ name: string; score: number; triggered: boolean }>;
  modelScores: Array<{ name: string; score: number }>;
}

export function TestRunDialog({
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

      const res: TestResult = {
        aggregateScore: Math.random() * 0.85,
        ruleScores: ruleNodes.map((n) => ({
          name: (n.data.label as string) || "Unnamed Rule",
          score: Math.random(),
          triggered: Math.random() > 0.5,
        })),
        modelScores: modelNodes.map((n) => ({
          name: (n.data.label as string) || "Unnamed Model",
          score: Math.random() * 0.5,
        })),
      };

      setResult(res);
      setIsRunning(false);

      // Inject runtime feedback into graph nodes
      setNodes((prev) =>
        prev.map((n) => {
          if (n.type === "rule") {
            const r = res.ruleScores.find((rs) => rs.name === n.data.label);
            return {
              ...n,
              data: {
                ...n.data,
                triggered: r?.triggered ?? false,
                runtimeScore: r?.score ?? 0,
              },
            };
          }
          if (n.type === "aggregator" || n.type === "logicAggregator") {
            return {
              ...n,
              data: { ...n.data, aggregateScore: res.aggregateScore },
            };
          }
          return n;
        })
      );
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Rocket className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle>Orchestration Test Run</DialogTitle>
          </div>
          <DialogDescription>
            Simulate real-time event processing through your logic graph.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!result && !isRunning && (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-4 bg-muted/20 rounded-xl border border-dashed border-border/60">
              <div className="rounded-full bg-primary/10 p-4">
                <Play className="h-8 w-8 text-primary/60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ready to Simulate</p>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  Click the button below to start a test run and see how data flows through your nodes.
                </p>
              </div>
              <Button onClick={handleRun} size="sm" className="mt-2">
                Start Simulation
              </Button>
            </div>
          )}

          {isRunning && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-6">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-t-2 border-primary animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium animate-pulse">Running Simulation...</p>
                <p className="text-[11px] text-muted-foreground">Evaluating rules and model scores</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 flex flex-col items-center justify-center py-6 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">
                    Final Aggregated Score
                  </p>
                  <div className="text-4xl font-black text-primary">
                    {(result.aggregateScore * 100).toFixed(1)}%
                  </div>
                  <Badge variant="outline" className="mt-2 bg-background/50 border-primary/30">
                    High Confidence
                  </Badge>
                </div>
              </div>

              <Tabs defaultValue="rules" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/40">
                  <TabsTrigger value="rules" className="text-xs">Rules</TabsTrigger>
                  <TabsTrigger value="models" className="text-xs">Models</TabsTrigger>
                </TabsList>
                <TabsContent value="rules" className="pt-3 space-y-2">
                  {result.ruleScores.map((r) => (
                    <div key={r.name} className="flex items-center justify-between p-2 rounded bg-card/40 border border-border/30">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-3 w-3 text-amber-400" />
                        <span className="text-xs font-medium">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {(r.score * 100).toFixed(0)}%
                        </span>
                        {r.triggered ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[9px] px-1.5 h-4">
                            Triggered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground/60 text-[9px] px-1.5 h-4">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="models" className="pt-3 space-y-2">
                  {result.modelScores.map((m) => (
                    <div key={m.name} className="flex items-center justify-between p-2 rounded bg-card/40 border border-border/30">
                      <div className="flex items-center gap-2">
                        <Brain className="h-3 w-3 text-indigo-400" />
                        <span className="text-xs font-medium">{m.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-primary font-bold">
                        {(m.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {result && (
          <div className="flex justify-end gap-2 border-t border-border/30 pt-4">
            <Button variant="outline" size="sm" onClick={() => setResult(null)}>
              Reset
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              Close Results
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
