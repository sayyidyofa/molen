import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { DialogFooter } from "../ui/dialog";

import { DataType, MLModel } from "@molen/shared-types";

interface ModelFormProps {
  initialData?: MLModel;
  onSubmit: (data: Omit<MLModel, 'id'>) => void;
  onCancel: () => void;
}

export function ModelForm({ initialData, onSubmit, onCancel }: ModelFormProps) {
  const [formData, setFormData] = useState<Omit<MLModel, 'id'>>({
    name: initialData?.name || "",
    version: initialData?.version || "v1.0",
    accuracy: initialData?.accuracy || 95,
    fpr: initialData?.fpr || 1.0,
    modelUrl: initialData?.modelUrl || "",
    outputType: DataType.ANOMALY_SCORE,
    status: initialData?.status || "training",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Model Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Fraud Score XGBoost"
          required
          className="bg-input border-border/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="v1.0"
            required
            className="bg-input border-border/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger className="bg-input border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deployed">Deployed</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="accuracy">Accuracy (%)</Label>
          <Input
            id="accuracy"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.accuracy}
            onChange={(e) => setFormData({ ...formData, accuracy: Number(e.target.value) })}
            required
            className="bg-input border-border/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fpr">FPR (%)</Label>
          <Input
            id="fpr"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.fpr}
            onChange={(e) => setFormData({ ...formData, fpr: Number(e.target.value) })}
            required
            className="bg-input border-border/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="modelUrl">Model URL</Label>
        <Input
          id="modelUrl"
          value={formData.modelUrl}
          onChange={(e) => setFormData({ ...formData, modelUrl: e.target.value })}
          placeholder="e.g., s3://models/fraud-v1.tar.gz"
          required
          className="bg-input border-border/50 font-mono text-sm"
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
