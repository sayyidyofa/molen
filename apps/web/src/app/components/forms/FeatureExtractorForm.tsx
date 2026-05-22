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

import { DataType, FeatureExtractor } from "@molen/shared-types";

interface FeatureExtractorFormProps {
  initialData?: FeatureExtractor;
  onSubmit: (data: Omit<FeatureExtractor, 'id'>) => void;
  onCancel: () => void;
}

export function FeatureExtractorForm({ initialData, onSubmit, onCancel }: FeatureExtractorFormProps) {
  const [formData, setFormData] = useState<Omit<FeatureExtractor, 'id'>>({
    name: initialData?.name || "",
    sourceField: initialData?.sourceField || "",
    transformation: initialData?.transformation || "NONE",
    outputType: initialData?.outputType || DataType.STRING,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Extractor Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Transaction Amount"
          required
          className="bg-input border-border/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="outputType">Output Type</Label>
        <Select
          value={formData.outputType}
          onValueChange={(value) => setFormData({ ...formData, outputType: value as DataType })}
        >
          <SelectTrigger className="bg-input border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={DataType.STRING}>{DataType.STRING}</SelectItem>
            <SelectItem value={DataType.NUMBER}>{DataType.NUMBER}</SelectItem>
            <SelectItem value={DataType.BOOLEAN}>{DataType.BOOLEAN}</SelectItem>
            <SelectItem value={DataType.TIMESTAMP}>{DataType.TIMESTAMP}</SelectItem>
            <SelectItem value={DataType.GEO_COORDINATES}>{DataType.GEO_COORDINATES}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceField">JSON Path (Source Field)</Label>
        <Input
          id="sourceField"
          value={formData.sourceField}
          onChange={(e) => setFormData({ ...formData, sourceField: e.target.value })}
          placeholder="e.g., amount"
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
