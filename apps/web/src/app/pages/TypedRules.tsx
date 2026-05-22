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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Edit, Trash2, Code, Shield, AlertTriangle, CheckCircle, Database } from "lucide-react";
import { useCombinedAppState, useAddRuleType, useUpdateRuleType, useAddTypedRule, useUpdateTypedRule, useDeleteRuleType, useDeleteTypedRule } from "../hooks/useMolenApi";
import { toast } from "sonner";
import { RuleTypeDialog } from "../components/ruleEngine/RuleTypeDialog";
import { TypedRuleForm } from "../components/ruleEngine/TypedRuleForm";
import { RuleTypeView, TypedRuleView, TypeColors } from "../types/ruleEngine";

export function TypedRules() {
  const state = useCombinedAppState();
  const addRuleType = useAddRuleType();
  const updateRuleType = useUpdateRuleType();
  const deleteRuleType = useDeleteRuleType();
  const addTypedRule = useAddTypedRule();
  const updateTypedRule = useUpdateTypedRule();
  const deleteTypedRule = useDeleteTypedRule();

  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<TypedRuleView | null>(null);

  const handleDeleteRuleType = (id: string, name: string) => {
    deleteRuleType.mutate(id, {
      onSuccess: () => {
        toast.success(`Deleted rule type: ${name}`);
      },
      onError: (err) => {
        toast.error(`Failed to delete rule type: ${err.message}`);
      }
    });
  };

  const handleRuleTypeSubmit = (data: RuleTypeView) => {
    const existing = state.ruleTypes.find((rt: any) => rt.id === data.id);
    if (existing) {
      updateRuleType.mutate({ id: data.id, ruleType: data }, {
        onSuccess: () => {
          toast.success(`Updated ${data.name}`);
        },
        onError: (err) => {
          toast.error(`Failed to update rule type: ${err.message}`);
        }
      });
    } else {
      addRuleType.mutate(data, {
        onSuccess: () => {
          toast.success(`Created ${data.name}`);
        },
        onError: (err) => {
          toast.error(`Failed to create rule type: ${err.message}`);
        }
      });
    }
  };

  const handleCreateRule = () => {
    setEditingRule(null);
    setRuleDialogOpen(true);
  };

  const handleEditRule = (rule: TypedRuleView) => {
    setEditingRule(rule);
    setRuleDialogOpen(true);
  };

  const handleRuleSubmit = (data: TypedRuleView) => {
    if (editingRule) {
      updateTypedRule.mutate({ id: editingRule.id, typedRule: data }, {
        onSuccess: () => {
          toast.success(`Updated ${data.name}`);
          setRuleDialogOpen(false);
          setEditingRule(null);
        },
        onError: (err) => {
          toast.error(`Failed to update rule: ${err.message}`);
        }
      });
    } else {
      addTypedRule.mutate(data, {
        onSuccess: () => {
          toast.success(`Created ${data.name}`);
          setRuleDialogOpen(false);
          setEditingRule(null);
        },
        onError: (err) => {
          toast.error(`Failed to create rule: ${err.message}`);
        }
      });
    }
  };

  const handleDeleteRule = (id: string, name: string) => {
    deleteTypedRule.mutate(id, {
      onSuccess: () => {
        toast.success(`Deleted rule: ${name}`);
      },
      onError: (err) => {
        toast.error(`Failed to delete rule: ${err.message}`);
      }
    });
  };

  const getRuleTypeById = (id: string) => {
    return state.ruleTypes.find((rt: any) => rt.id === id);
  };

  const actionConfig: Record<string, any> = {
    BLOCK: { icon: Shield, color: "text-red-500", bg: "bg-red-500/20", border: "border-red-500/50" },
    REVIEW: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/20", border: "border-yellow-500/50" },
    ALLOW: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/20", border: "border-green-500/50" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2">Typed Logic Orchestrator</h1>
          <p className="text-muted-foreground">
            Build type-safe rules with visual blocks or pro-code expressions
          </p>
        </div>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Code className="h-3 w-3" />
            Typed Rules
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Database className="h-3 w-3" />
            Rule Types
          </TabsTrigger>
        </TabsList>

        {/* Typed Rules Tab */}
        <TabsContent value="rules" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button className="bg-primary hover:bg-primary/90" onClick={handleCreateRule}>
              <Plus className="mr-2 h-4 w-4" />
              New Typed Rule
            </Button>
          </div>

          <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Logic Preview</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.typedRules.map((rule) => {
                  const ruleType = getRuleTypeById(rule.ruleTypeId);
                  const actionCfg = actionConfig[rule.action] || { icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted", border: "border-border" };
                  const ActionIcon = actionCfg.icon;

                  const logicPreview =
                    rule.codeExpression && rule.codeExpression.trim() !== ""
                      ? rule.codeExpression?.substring(0, 50) + "..."
                      : `${rule.visualBlocks?.length || 0} conditions`;

                  return (
                    <TableRow
                      key={rule.id}
                      className="border-border/30 hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        {ruleType && (
                          <Badge variant="outline" className="border-border/50">
                            {ruleType.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground max-w-xs truncate">
                        {logicPreview}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${actionCfg.bg} ${actionCfg.color} ${actionCfg.border} flex items-center gap-1 w-fit`}
                        >
                          <ActionIcon className="h-3 w-3" />
                          {rule.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={rule.status === "active" ? "default" : "secondary"}
                          className={
                            rule.status === "active"
                              ? "bg-primary/20 text-primary border-primary/30"
                              : ""
                          }
                        >
                          {rule.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                            onClick={() => handleDeleteRule(rule.id, rule.name)}
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
        </TabsContent>

        {/* Rule Types Tab */}
        <TabsContent value="types" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <RuleTypeDialog
              trigger={
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  New Rule Type
                </Button>
              }
              onSubmit={handleRuleTypeSubmit}
            />
          </div>

          <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Base Type</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.ruleTypes.map((ruleType) => {
                  const colors = TypeColors[ruleType.baseType];
                  return (
                    <TableRow
                      key={ruleType.id}
                      className="border-border/30 hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">{ruleType.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${colors.bg} ${colors.color} ${colors.border}`}
                        >
                          {ruleType.baseType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ruleType.schema && ruleType.schema.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {ruleType.schema.slice(0, 3).map((prop) => (
                              <Badge
                                key={prop.key}
                                variant="outline"
                                className="text-xs border-border/50"
                              >
                                {prop.key}
                              </Badge>
                            ))}
                            {ruleType.schema.length > 3 && (
                              <Badge variant="outline" className="text-xs border-border/50">
                                +{ruleType.schema.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {ruleType.description || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <RuleTypeDialog
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <Edit className="h-4 w-4" />
                              </Button>
                            }
                            initialData={ruleType}
                            onSubmit={handleRuleTypeSubmit}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                            onClick={() => handleDeleteRuleType(ruleType.id, ruleType.name)}
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
        </TabsContent>
      </Tabs>

      {/* Typed Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="bg-popover border-border/50 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Typed Rule" : "New Typed Rule"}</DialogTitle>
            <DialogDescription>
              Build type-safe logic using visual blocks or code expressions
            </DialogDescription>
          </DialogHeader>
          <TypedRuleForm
            initialData={editingRule || undefined}
            ruleTypes={state.ruleTypes}
            onSubmit={handleRuleSubmit}
            onCancel={() => setRuleDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
