import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Code, Database } from "lucide-react";
import { useCombinedAppState, useAddRuleType, useUpdateRuleType, useAddTypedRule, useUpdateTypedRule, useDeleteRuleType, useDeleteTypedRule } from "../hooks/useMolenApi";
import { toast } from "sonner";
import { RuleTypeDialog } from "../components/ruleEngine/RuleTypeDialog";
import { TypedRuleForm } from "../components/ruleEngine/TypedRuleForm";
import { RuleTypeView, TypedRuleView } from "../types/ruleEngine";
import { RuleTypeTable } from "./TypedRules/components/RuleTypeTable";
import { TypedRuleTable } from "./TypedRules/components/TypedRuleTable";

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
      onSuccess: () => toast.success(`Deleted rule type: ${name}`),
      onError: (err) => toast.error(`Failed to delete rule type: ${err.message}`)
    });
  };

  const handleRuleTypeSubmit = (data: RuleTypeView) => {
    const existing = (state.ruleTypes as RuleTypeView[]).find((rt) => rt.id === data.id);
    if (existing) {
      updateRuleType.mutate({ id: data.id, ruleType: data }, {
        onSuccess: () => toast.success(`Updated ${data.name}`),
        onError: (err) => toast.error(`Failed to update rule type: ${err.message}`)
      });
    } else {
      addRuleType.mutate(data, {
        onSuccess: () => toast.success(`Created ${data.name}`),
        onError: (err) => toast.error(`Failed to create rule type: ${err.message}`)
      });
    }
  };

  const handleRuleSubmit = (data: TypedRuleView) => {
    const mutationArgs = {
      onSuccess: () => {
        toast.success(`${editingRule ? 'Updated' : 'Created'} ${data.name}`);
        setRuleDialogOpen(false);
        setEditingRule(null);
      },
      onError: (err: Error) => toast.error(`Operation failed: ${err.message}`)
    };

    if (editingRule) {
      updateTypedRule.mutate({ id: editingRule.id, typedRule: data }, mutationArgs);
    } else {
      addTypedRule.mutate(data, mutationArgs);
    }
  };

  const handleDeleteRule = (id: string, name: string) => {
    deleteTypedRule.mutate(id, {
      onSuccess: () => toast.success(`Deleted rule: ${name}`),
      onError: (err) => toast.error(`Failed to delete rule: ${err.message}`)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <Code className="h-6 w-6 text-primary" /> Typed Rules
          </h1>
          <p className="text-muted-foreground text-sm">Define specialized rule templates and instances</p>
        </div>
        <div className="flex gap-2">
          <RuleTypeDialog onSubmit={handleRuleTypeSubmit} trigger={
            <Button variant="outline"><Database className="mr-2 h-4 w-4" /> New Rule Type</Button>
          } />
          <Button onClick={() => { setEditingRule(null); setRuleDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> New Rule
          </Button>
        </div>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="rules" className="px-6">Rule Instances</TabsTrigger>
          <TabsTrigger value="types" className="px-6">Rule Types Registry</TabsTrigger>
        </TabsList>
        <TabsContent value="rules" className="mt-4">
          <TypedRuleTable 
            typedRules={state.typedRules as TypedRuleView[]} 
            ruleTypes={state.ruleTypes as RuleTypeView[]}
            onEdit={(r) => { setEditingRule(r); setRuleDialogOpen(true); }} 
            onDelete={handleDeleteRule} 
          />
        </TabsContent>
        <TabsContent value="types" className="mt-4">
          <RuleTypeTable ruleTypes={state.ruleTypes as RuleTypeView[]} onDelete={handleDeleteRuleType} />
        </TabsContent>
      </Tabs>

      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-2xl bg-popover border-border/50">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
            <DialogDescription>Configure a rule instance based on a defined rule type.</DialogDescription>
          </DialogHeader>
          <TypedRuleForm initialData={editingRule} ruleTypes={state.ruleTypes as RuleTypeView[]} onSubmit={handleRuleSubmit} onCancel={() => setRuleDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
