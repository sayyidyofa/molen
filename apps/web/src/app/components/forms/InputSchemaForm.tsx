import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DialogFooter } from "../ui/dialog";
import { JsonSchemaBuilder } from "./JsonSchemaBuilder";

import { InputSchema } from "@molen/shared-types";

interface InputSchemaFormProps {
  initialData?: InputSchema;
  onSubmit: (data: Omit<InputSchema, 'id'>) => void;
  onCancel: () => void;
}

export function InputSchemaForm({ initialData, onSubmit, onCancel }: InputSchemaFormProps) {
  const [formData, setFormData] = useState<Omit<InputSchema, 'id'>>({
    name: initialData?.name || "",
    version: initialData?.version || "v1.0",
    status: initialData?.status || "draft",
    fields: initialData?.fields || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Schema Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Stripe Webhook"
            required
            className="bg-input border-border/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="e.g., v1.0"
            required
            className="bg-input border-border/50"
          />
        </div>
      </div>

      <JsonSchemaBuilder
        value={formData.fields}
        onChange={(fields) => setFormData({ ...formData, fields })}
      />

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
