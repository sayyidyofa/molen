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
import { DialogFooter } from "../ui/dialog";

import { Rule, RuleAction } from "@molen/shared-types";

interface RuleFormProps {
  initialData?: Rule;
  onSubmit: (data: Omit<Rule, 'id'>) => void;
  onCancel: () => void;
}

export function RuleForm({ initialData, onSubmit, onCancel }: RuleFormProps) {
  const [formData, setFormData] = useState<Omit<Rule, 'id'>>({
    name: initialData?.name || "",
    condition: initialData?.condition || "",
    action: initialData?.action || RuleAction.REVIEW,
    anomalyScore: initialData?.anomalyScore || 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., High Value Block"
          required
          className="bg-input border-border/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="condition">Condition</Label>
        <Textarea
          id="condition"
          value={formData.condition}
          onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
          placeholder="e.g., amount > 5000"
          required
          className="bg-input border-border/50 font-mono text-sm min-h-20"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="action">Action</Label>
        <Select
          value={formData.action}
          onValueChange={(value) => setFormData({ ...formData, action: value as RuleAction })}
        >
          <SelectTrigger className="bg-input border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={RuleAction.ALLOW}>{RuleAction.ALLOW}</SelectItem>
            <SelectItem value={RuleAction.REVIEW}>{RuleAction.REVIEW}</SelectItem>
            <SelectItem value={RuleAction.BLOCK}>{RuleAction.BLOCK}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="anomalyScore">Anomaly Score</Label>
        <Input
          id="anomalyScore"
          type="number"
          min="0"
          max="100"
          value={formData.anomalyScore}
          onChange={(e) => setFormData({ ...formData, anomalyScore: Number(e.target.value) })}
          required
          className="bg-input border-border/50"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          {initialData ? "Update" : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
