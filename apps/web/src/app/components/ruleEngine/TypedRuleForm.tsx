import { useState } from "react";
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
import { Badge } from "../ui/badge";
import { DialogFooter } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Blocks, Code, RefreshCw } from "lucide-react";
import { RuleAction, TypedRuleView, RuleTypeView } from "../../types/ruleEngine";
import { visualBlocksToCode, codeToVisualBlocks, validateRuleExpression } from "../../state/ruleEngineState";
import { VisualLogicBuilder } from "./VisualLogicBuilder";
import { CodeLogicEditor } from "./CodeLogicEditor";
import { ActionSelect } from "./TypedRuleForm/ActionSelect";

interface TypedRuleFormProps {
  initialData?: TypedRuleView | null;
  ruleTypes: RuleTypeView[];
  onSubmit: (data: TypedRuleView) => void;
  onCancel: () => void;
}

export function TypedRuleForm({ initialData, ruleTypes, onSubmit, onCancel }: TypedRuleFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    ruleTypeId: initialData?.ruleTypeId || "",
    description: initialData?.description || "",
    mode: initialData?.mode || "visual",
    visualBlocks: initialData?.visualBlocks || [],
    codeExpression: initialData?.codeExpression || "",
    action: initialData?.action || RuleAction.BLOCK,
    priority: initialData?.priority || 5,
    status: initialData?.status || "active",
  });

  const selectedRuleType = ruleTypes.find((rt) => rt.id === formData.ruleTypeId);
  const codeFromBlocks = selectedRuleType ? visualBlocksToCode(formData.visualBlocks) : "";
  const isSynced = !selectedRuleType || (codeFromBlocks.trim() === formData.codeExpression.trim() || formData.visualBlocks.length === 0 || formData.codeExpression.trim() === "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRuleType) return;
    const validationStatus = formData.mode === "code" ? validateRuleExpression(formData.codeExpression) : { valid: formData.visualBlocks.length > 0 };
    onSubmit({ id: initialData?.id || `tr-${Date.now()}`, ...formData, validationStatus });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Rule Name</Label>
          <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-input border-border/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ruleType">Input Type</Label>
          <Select value={formData.ruleTypeId} onValueChange={(v) => setFormData({ ...formData, ruleTypeId: v, visualBlocks: [], codeExpression: "" })}>
            <SelectTrigger className="bg-input border-border/50"><SelectValue /></SelectTrigger>
            <SelectContent>{ruleTypes.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}><div className="flex items-center gap-2"><span>{rt.name}</span><Badge variant="outline" className="text-xs">{rt.baseType}</Badge></div></SelectItem>
            ))}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-input border-border/50 min-h-20" />
      </div>

      {selectedRuleType && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Rule Logic</Label>
            {isSynced && (formData.visualBlocks.length > 0 || formData.codeExpression.trim() !== "") && (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10"><RefreshCw className="h-3 w-3 mr-1" />Synced</Badge>
            )}
          </div>
          <Tabs value={formData.mode} onValueChange={(v) => {
            const newMode = v as "visual" | "code";
            let updatedFormData = { ...formData, mode: newMode };
            if (newMode === "code" && formData.visualBlocks.length > 0) {
              updatedFormData = { ...updatedFormData, codeExpression: visualBlocksToCode(formData.visualBlocks) };
            } else if (newMode === "visual" && formData.codeExpression.trim() !== "" && selectedRuleType) {
              const blocks = codeToVisualBlocks(formData.codeExpression, selectedRuleType);
              if (blocks.length > 0) {
                updatedFormData = { ...updatedFormData, visualBlocks: blocks };
              }
            }
            setFormData(updatedFormData);
          }}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="visual" className="gap-2"><Blocks className="h-3 w-3" />Visual Builder</TabsTrigger>
              <TabsTrigger value="code" className="gap-2"><Code className="h-3 w-3" />Code Editor</TabsTrigger>
            </TabsList>
            <TabsContent value="visual" className="mt-4"><VisualLogicBuilder ruleType={selectedRuleType} blocks={formData.visualBlocks} onChange={(b) => setFormData({ ...formData, visualBlocks: b })} /></TabsContent>
            <TabsContent value="code" className="mt-4"><CodeLogicEditor ruleType={selectedRuleType} value={formData.codeExpression} onChange={(v) => setFormData({ ...formData, codeExpression: v })} /></TabsContent>
          </Tabs>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <ActionSelect value={formData.action} onChange={(v) => setFormData({ ...formData, action: v })} />
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Input id="priority" type="number" min="1" max="10" value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })} className="bg-input border-border/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger className="bg-input border-border/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">{initialData ? "Update Rule" : "Create Rule"}</Button>
      </DialogFooter>
    </form>
  );
}
