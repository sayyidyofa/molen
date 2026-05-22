import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DialogFooter } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Code, Blocks, Shield, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { TypedRuleView, LogicBlock, RuleTypeView, RuleAction } from "../../types/ruleEngine";
import { visualBlocksToCode, codeToVisualBlocks, validateRuleExpression } from "../../state/ruleEngineState";
import { VisualLogicBuilder } from "./VisualLogicBuilder";
import { CodeLogicEditor } from "./CodeLogicEditor";

interface TypedRuleFormProps {
  initialData?: TypedRuleView;
  ruleTypes: RuleTypeView[];
  onSubmit: (data: TypedRuleView) => void;
  onCancel: () => void;
}

export function TypedRuleForm({ initialData, ruleTypes, onSubmit, onCancel }: TypedRuleFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    ruleTypeId: initialData?.ruleTypeId || ruleTypes[0]?.id || "",
    description: initialData?.description || "",
    mode: initialData?.mode || ("visual" as "visual" | "code"),
    visualBlocks: initialData?.visualBlocks || ([] as LogicBlock[]),
    codeExpression: initialData?.codeExpression || "",
    action: initialData?.action || RuleAction.REVIEW,
    priority: initialData?.priority || 1,
    status: initialData?.status || "draft",
  });

  const [isSynced, setIsSynced] = useState(true);
  const selectedRuleType = ruleTypes.find(rt => rt.id === formData.ruleTypeId);

  // Bidirectional sync when switching modes
  useEffect(() => {
    if (!selectedRuleType) return;

    if (formData.mode === "code" && formData.visualBlocks.length > 0) {
      // Switching to code mode - convert visual blocks to code
      const codeExpr = visualBlocksToCode(formData.visualBlocks);
      setFormData((prev) => ({ ...prev, codeExpression: codeExpr }));
      setIsSynced(true);
    } else if (formData.mode === "visual" && formData.codeExpression.trim() !== "") {
      // Switching to visual mode - parse code to blocks
      const blocks = codeToVisualBlocks(formData.codeExpression, selectedRuleType);
      if (blocks.length > 0) {
        setFormData((prev) => ({ ...prev, visualBlocks: blocks }));
        setIsSynced(true);
      }
    }
  }, [formData.mode]);

  // Track if data is synced
  useEffect(() => {
    if (!selectedRuleType) return;

    const codeFromBlocks = visualBlocksToCode(formData.visualBlocks, selectedRuleType);
    const blocksMatch = codeFromBlocks.trim() === formData.codeExpression.trim();
    setIsSynced(blocksMatch || formData.visualBlocks.length === 0 || formData.codeExpression.trim() === "");
  }, [formData.visualBlocks, formData.codeExpression]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRuleType) {
      return;
    }

    const validationStatus =
      formData.mode === "code" && selectedRuleType
        ? validateRuleExpression(formData.codeExpression)
        : { valid: formData.visualBlocks.length > 0 };

    onSubmit({
      id: initialData?.id || `tr-${Date.now()}`,
      ...formData,
      validationStatus,
    });
  };

  const actionConfig: Record<string, any> = {
    [RuleAction.BLOCK]: { icon: Shield, color: "text-red-500", bg: "bg-red-500/20", border: "border-red-500/50" },
    [RuleAction.REVIEW]: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/20", border: "border-yellow-500/50" },
    [RuleAction.ALLOW]: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/20", border: "border-green-500/50" },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Rule Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., High Value Transaction"
            required
            className="bg-input border-border/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ruleType">Input Type</Label>
          <Select
            value={formData.ruleTypeId}
            onValueChange={(value) =>
              setFormData({ ...formData, ruleTypeId: value, visualBlocks: [], codeExpression: "" })
            }
          >
            <SelectTrigger className="bg-input border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ruleTypes.map((rt) => (
                <SelectItem key={rt.id} value={rt.id}>
                  <div className="flex items-center gap-2">
                    <span>{rt.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {rt.baseType}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this rule does..."
          className="bg-input border-border/50 min-h-20"
        />
      </div>

      {/* Dual-Mode Logic Builder */}
      {selectedRuleType && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Rule Logic</Label>
            {isSynced && (formData.visualBlocks.length > 0 || formData.codeExpression.trim() !== "") && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                <RefreshCw className="h-3 w-3 mr-1" />
                Synced
              </Badge>
            )}
          </div>
          <Tabs
            value={formData.mode}
            onValueChange={(value) => setFormData({ ...formData, mode: value as any })}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual" className="flex items-center gap-2">
                <Blocks className="h-3 w-3" />
                Visual Builder
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-3 w-3" />
                Code Editor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="mt-4">
              <VisualLogicBuilder
                ruleType={selectedRuleType}
                blocks={formData.visualBlocks}
                onChange={(blocks) => setFormData({ ...formData, visualBlocks: blocks })}
              />
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <CodeLogicEditor
                ruleType={selectedRuleType}
                value={formData.codeExpression}
                onChange={(value) => setFormData({ ...formData, codeExpression: value })}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Action & Priority */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="action">Action</Label>
          <Select
            value={formData.action}
            onValueChange={(value: any) => setFormData({ ...formData, action: value })}
          >
            <SelectTrigger className="bg-input border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(RuleAction).map((action) => {
                const config = actionConfig[action];
                const ActionIcon = config.icon;
                return (
                  <SelectItem key={action} value={action}>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`${config.bg} ${config.color} ${config.border} flex items-center gap-1`}
                      >
                        <ActionIcon className="h-3 w-3" />
                        {action}
                      </Badge>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input
            id="priority"
            type="number"
            min="1"
            max="10"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
            className="bg-input border-border/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="bg-input border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          {initialData ? "Update Rule" : "Create Rule"}
        </Button>
      </DialogFooter>
    </form>
  );
}
