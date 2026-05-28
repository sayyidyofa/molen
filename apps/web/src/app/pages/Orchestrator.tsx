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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Card } from "../components/ui/card";
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
} from "lucide-react";
import { useCombinedAppState, useSaveDraft, useDeleteDraft } from "../hooks/useMolenApi";
import { toast } from "sonner";
import { Draft } from "@molen/shared-types";
import { formatDate, LatencyBadge, StatCard } from "./Orchestrator/components/OrchestratorComponents";
import { NewOrchestratorDialog } from "./Orchestrator/components/NewOrchestratorDialog";
import { DeleteConfirmDialog } from "./Orchestrator/components/DeleteConfirmDialog";

const statusConfig = {
  active: { label: "Active", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  testing: { label: "Testing", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  draft: { label: "Draft", className: "bg-slate-500/15 text-slate-400 border-slate-500/30" },
} as const;

export function Orchestrator() {
  const navigate = useNavigate();
  const state = useCombinedAppState();
  const saveDraft = useSaveDraft();
  const deleteDraft = useDeleteDraft();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeCount = state.orchestrators.filter((o) => o.status === "active").length;
  const draftCount = state.orchestrators.filter((o) => o.status === "draft" || !o.status).length;

  const handleCreate = (name: string, description: string) => {
    saveDraft.mutate({
      name: name.trim(),
      description: description.trim(),
      graph: { nodes: [], edges: [] },
      updatedAt: new Date()
    }, {
      onSuccess: (data) => {
        toast.success("Orchestrator created", { description: name.trim() });
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
    status: o.status || 'draft',
    nodeCount: o.graph?.nodes?.length || 0,
    avgLatency: "24",
    p99Latency: "42",
    lastModified: o.updatedAt || new Date().toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="rounded-lg bg-primary/15 border border-primary/20 p-1.5">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Orchestrators</h1>
          </div>
          <p className="text-sm text-muted-foreground"> Composable fraud-detection pipelines </p>
        </div>
        <NewOrchestratorDialog onCreate={handleCreate} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Activity} label="Active Pipelines" value={activeCount} accent="bg-emerald-500/15 text-emerald-400" />
        <StatCard icon={GitMerge} label="In Testing" value={0} accent="bg-amber-500/15 text-amber-400" />
        <StatCard icon={Cpu} label="Drafts" value={draftCount} accent="bg-slate-500/15 text-slate-400" />
        <StatCard icon={Clock} label="Avg Execution" value="24ms" accent="bg-primary/15 text-primary" />
      </div>

      <Card className="border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-[300px]">Pipeline Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Nodes</TableHead>
              <TableHead className="text-right">Avg. Latency</TableHead>
              <TableHead className="text-right">p99</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mappedOrchestrators.map((orch) => {
              const sc = statusConfig[orch.status as keyof typeof statusConfig] || statusConfig.draft;
              return (
                <TableRow key={orch.id} className="group cursor-pointer hover:bg-muted/30 transition-colors border-border/40" onClick={() => navigate(`/orchestrator/${orch.id}/edit`)}>
                  <TableCell className="font-medium">{orch.name}</TableCell>
                  <TableCell><Badge variant="outline" className={`${sc.className} text-xs`}>{sc.label}</Badge></TableCell>
                  <TableCell className="text-right font-mono text-sm">{orch.nodeCount}</TableCell>
                  <TableCell className="text-right"><LatencyBadge ms={orch.avgLatency} /></TableCell>
                  <TableCell className="text-right"><LatencyBadge ms={orch.p99Latency} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {formatDate(orch.lastModified)}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border/50 w-44">
                        <DropdownMenuItem onClick={() => navigate(`/orchestrator/${orch.id}/edit`)} className="gap-2"><Pencil className="h-3.5 w-3.5" />Open Editor</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleClone(orch)} className="gap-2"><Copy className="h-3.5 w-3.5" />Clone</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/40" />
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => setDeleteId(orch.id)}><Trash2 className="h-3.5 w-3.5" />Delete</DropdownMenuItem>
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
            <div className="rounded-full bg-muted/50 p-4 mb-4"><Network className="h-8 w-8 text-muted-foreground" /></div>
            <p className="text-sm font-medium mb-1">No orchestrators yet</p>
            <Button size="sm" onClick={() => handleCreate("New Orchestrator", "")} className="bg-primary hover:bg-primary/90"><Plus className="mr-2 h-3.5 w-3.5" />New Orchestrator</Button>
          </div>
        )}
      </Card>
      <DeleteConfirmDialog id={deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
