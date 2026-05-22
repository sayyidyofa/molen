import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { DialogFooter } from "../ui/dialog";
import { TypeSafeSchemaBuilder } from "./TypeSafeSchemaBuilder";
import { InputSchema, SchemaField } from "../../types/molen";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface TypeSafeInputSchemaFormProps {
  initialData?: InputSchema;
  onSubmit: (data: InputSchema) => void;
  onCancel: () => void;
}

export function TypeSafeInputSchemaForm({
  initialData,
  onSubmit,
  onCancel,
}: TypeSafeInputSchemaFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    version: initialData?.version || "v1.0",
    status: initialData?.status || ("draft" as const),
    fields: initialData?.fields || ([] as SchemaField[]),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    onSubmit({
      id: initialData?.id || `schema-${Date.now()}`,
      ...formData,
      createdAt: initialData?.createdAt || now,
      updatedAt: now,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
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
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="deprecated">Deprecated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TypeSafeSchemaBuilder
        value={formData.fields}
        onChange={(fields) => setFormData({ ...formData, fields })}
      />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          {initialData ? "Update Schema" : "Create Schema"}
        </Button>
      </DialogFooter>
    </form>
  );
}
