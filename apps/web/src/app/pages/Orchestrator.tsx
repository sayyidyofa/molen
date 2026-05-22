import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import {
  Network,
  Plus,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Activity,
  Cpu,
  Clock,
  GitMerge,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useCombinedAppState, useSaveDraft, useDeleteDraft } from "../hooks/useMolenApi";
import { toast } from "sonner";
import { Draft } from "@molen/shared-types";

const statusConfig = {
  active: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  testing: {
    label: "Testing",
    className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  draft: {
    label: "Draft",
    className: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  },
} as const;

function formatDate(iso: string | Date) {
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

function LatencyBadge({ ms }: { ms: string | number }) {
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

function StatCard({
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

export function Orchestrator() {
  const state = useCombinedAppState();
  const saveDraft = useSaveDraft();
  const deleteDraft = useDeleteDraft();
  const navigate = useNavigate();
  const [newOpen, setNewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const activeCount = state.orchestrators.filter((o) => (o as unknown as { status: string }).status === "active").length;
  const avgLatency =
    state.orchestrators.length > 0
      ? "24ms" // Static for now as it's not in the model
      : "0ms";

  const handleCreate = () => {
    if (!newName.trim()) return;
    saveDraft.mutate({
      name: newName.trim(),
      graph: { nodes: [], edges: [] },
      updatedAt: new Date()
    }, {
      onSuccess: (data) => {
        setNewOpen(false);
        setNewName("");
        setNewDesc("");
        toast.success("Orchestrator created", { description: newName.trim() });
        navigate(`/orchestrator/${data.id}/edit`);
      }
    });
  };

  const handleClone = (orch: Draft) => {
    saveDraft.mutate({
      name: `${orch.name} (Copy)`,
      graph: orch.graph || { nodes: [], edges: [] },
      updatedAt: new Date()
    }, {
      onSuccess: () => {
        toast.success("Orchestrator cloned", { description: `${orch.name} (Copy)` });
      }
    });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const name = state.orchestrators.find((o) => o.id === deleteId)?.name;
    deleteDraft.mutate(deleteId, {
      onSuccess: () => {
        toast.success("Orchestrator deleted", { description: name });
        setDeleteId(null);
      }
    });
  };

  const mappedOrchestrators = state.orchestrators.map((o) => ({
    ...o,
    status: (o as unknown as { status: string }).status || 'draft',
    nodeCount: o.graph?.nodes?.length || 0,
    edgeCount: o.graph?.edges?.length || 0,
    avgLatency: "24", // Placeholder
    p99Latency: "42", // Placeholder
    lastModified: o.updatedAt || new Date().toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="rounded-lg bg-primary/15 border border-primary/20 p-1.5">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <h1>Orchestrators</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Composable fraud-detection pipelines that aggregate anomaly scores from rules and models
          </p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              New Orchestrator
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-popover border-border/50">
            <DialogHeader>
              <DialogTitle>New Orchestrator</DialogTitle>
              <DialogDescription>
                Create a new fraud-detection pipeline. You can add nodes on the canvas after creation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Pipeline Name</Label>
                <Input
                  placeholder="e.g. High-Value Transaction Check"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-input border-border/50"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Description{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Textarea
                  placeholder="What does this pipeline detect?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="bg-input border-border/50 min-h-20 resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                Create & Open Editor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Activity}
          label="Active Pipelines"
          value={activeCount}
          accent="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          icon={GitMerge}
          label="Total Orchestrators"
          value={mappedOrchestrators.length}
          accent="bg-primary/15 text-primary"
        />
        <StatCard
          icon={Zap}
          label="Avg Latency"
          value={avgLatency}
          accent="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          icon={Cpu}
          label="Total Nodes"
          value={mappedOrchestrators.reduce((a, o) => a + o.nodeCount, 0)}
          accent="bg-violet-500/15 text-violet-400"
        />
      </div>

      {/* Table */}
      <Card className="border-border/40 bg-card/30">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium w-[280px]">Name</TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">Nodes</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">Avg Latency</TableHead>
              <TableHead className="text-muted-foreground font-medium text-right">p99</TableHead>
              <TableHead className="text-muted-foreground font-medium">Last Modified</TableHead>
              <TableHead className="text-muted-foreground font-medium w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedOrchestrators.map((orch) => {
              const sc = statusConfig[orch.status as keyof typeof statusConfig] || statusConfig.draft;
              return (
                <TableRow
                  key={orch.id}
                  className="border-border/30 hover:bg-muted/20 cursor-pointer group"
                  onClick={() => navigate(`/orchestrator/${orch.id}/edit`)}
                >
                  <TableCell>
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 rounded-md bg-sidebar-accent/60 p-1.5 shrink-0 group-hover:bg-primary/15 transition-colors">
                        <Network className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-foreground">{orch.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {orch.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${sc.className} text-xs`}>
                      {sc.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {orch.nodeCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <LatencyBadge ms={orch.avgLatency} />
                  </TableCell>
                  <TableCell className="text-right">
                    <LatencyBadge ms={orch.p99Latency} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(orch.lastModified)}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-popover border-border/50 w-44"
                      >
                        <DropdownMenuItem
                          onClick={() => navigate(`/orchestrator/${orch.id}/edit`)}
                          className="gap-2"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Open Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleClone(orch)}
                          className="gap-2"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Clone
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/40" />
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(orch.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {mappedOrchestrators.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted/50 p-4 mb-4">
              <Network className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium mb-1">No orchestrators yet</p>
            <p className="text-xs text-muted-foreground mb-4">
              Create your first fraud-detection pipeline to get started
            </p>
            <Button
              size="sm"
              onClick={() => setNewOpen(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              New Orchestrator
            </Button>
          </div>
        )}
      </Card>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="bg-popover border-border/50 max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="rounded-full bg-destructive/15 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete Orchestrator</DialogTitle>
            </div>
            <DialogDescription>
              This action cannot be undone. The pipeline and all its node configurations will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
