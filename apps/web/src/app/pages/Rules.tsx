import { useState } from "react";
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
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Plus, Edit, Trash2, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useCombinedAppState, useAddRule, useUpdateRule, useDeleteRule } from "../hooks/useMolenApi";
import { toast } from "sonner";
import { RuleForm } from "../components/forms/RuleForm";

import { Rule, RuleAction } from "@molen/shared-types";

const actionConfig = {
  [RuleAction.BLOCK]: { icon: Shield, color: "text-red-500", bg: "bg-red-500/20", border: "border-red-500/30" },
  [RuleAction.REVIEW]: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
  [RuleAction.ALLOW]: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/20", border: "border-green-500/30" },
};

export function Rules() {
  const state = useCombinedAppState();
  const addRule = useAddRule();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | undefined>(undefined);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteRule.mutate(id, {
        onSuccess: () => {
          toast.success(`Deleted ${name}`);
        },
        onError: (err) => {
          toast.error(`Failed to delete rule: ${err.message}`);
        }
      });
    }
  };

  const handleCreate = () => {
    setEditingRule(undefined);
    setDialogOpen(true);
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleSubmit = (data: Omit<Rule, 'id'>) => {
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, rule: data }, {
        onSuccess: () => {
          toast.success(`Updated ${data.name}`);
          setDialogOpen(false);
          setEditingRule(undefined);
        },
        onError: (err) => {
          toast.error(`Failed to update rule: ${err.message}`);
        }
      });
    } else {
      addRule.mutate(data, {
        onSuccess: () => {
          toast.success(`Created ${data.name}`);
          setDialogOpen(false);
          setEditingRule(undefined);
        },
        onError: (err) => {
          toast.error(`Failed to create rule: ${err.message}`);
        }
      });
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Rules</h1>
          <p className="text-muted-foreground">
            Define stateless logic gates for fraud detection
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Rule
        </Button>
      </div>

      <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead>Name</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Anomaly Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.rules.map((rule: Rule) => {
              const config = actionConfig[rule.action as keyof typeof actionConfig] || actionConfig[RuleAction.REVIEW];
              const ActionIcon = config.icon;
              const actionColor = config.color;
              const actionBg = config.bg;
              const actionBorder = config.border;

              return (
                <TableRow
                  key={rule.id}
                  className="border-border/30 hover:bg-muted/30"
                >
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {rule.condition}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${actionBg} ${actionColor} ${actionBorder} flex items-center gap-1 w-fit`}
                    >
                      <ActionIcon className="h-3 w-3" />
                      {rule.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border/50">
                      {rule.anomalyScore}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-muted"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                        onClick={() => handleDelete(rule.id, rule.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-popover border-border/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "New Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule ? "Update the fraud detection rule configuration" : "Define a new stateless rule for fraud detection"}
            </DialogDescription>
          </DialogHeader>
          <RuleForm
            initialData={editingRule}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
