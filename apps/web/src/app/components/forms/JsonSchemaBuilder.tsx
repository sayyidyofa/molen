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
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { Switch } from "../ui/switch";
import { SchemaField } from "@molen/shared-types";

interface JsonSchemaBuilderProps {
  value: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

export function JsonSchemaBuilder({ value, onChange }: JsonSchemaBuilderProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFields(newExpanded);
  };

  const addField = (parentPath: string[] = []) => {
    const newField: SchemaField = {
      id: `field-${Date.now()}`,
      name: "",
      type: "string",
      required: false,
    };

    const newFields = [...value];
    if (parentPath.length === 0) {
      newFields.push(newField);
    } else {
      // Add to nested object
      const parent = getFieldByPath(newFields, parentPath);
      if (parent && parent.type === "object") {
        if (!parent.properties) parent.properties = [];
        parent.properties.push(newField);
      }
    }
    onChange(newFields);
  };

  const getFieldByPath = (fields: SchemaField[], path: string[]): SchemaField | null => {
    let current: SchemaField[] = fields;
    let field: SchemaField | null = null;

    for (const id of path) {
      field = current.find((f) => f.id === id) || null;
      if (!field) return null;
      if (field.properties) {
        current = field.properties;
      }
    }
    return field;
  };

  const updateField = (id: string, updates: Partial<SchemaField>) => {
    const newFields = [...value];
    const updateRecursive = (fields: SchemaField[]): boolean => {
      for (let i = 0; i < fields.length; i++) {
        if (fields[i].id === id) {
          fields[i] = { ...fields[i], ...updates };
          // If changing to object, initialize properties
          if (updates.type === "object" && !fields[i].properties) {
            fields[i].properties = [];
          }
          // If changing to array, initialize items
          if (updates.type === "array" && !fields[i].items) {
            fields[i].items = {
              id: `${id}-items`,
              name: "items",
              type: "string",
              required: false,
            };
          }
          return true;
        }
        if (fields[i].properties && updateRecursive(fields[i].properties!)) {
          return true;
        }
      }
      return false;
    };
    updateRecursive(newFields);
    onChange(newFields);
  };

  const deleteField = (id: string) => {
    const newFields = [...value];
    const deleteRecursive = (fields: SchemaField[]): SchemaField[] => {
      return fields.filter((field) => {
        if (field.id === id) return false;
        if (field.properties) {
          field.properties = deleteRecursive(field.properties);
        }
        return true;
      });
    };
    onChange(deleteRecursive(newFields));
  };

  const generateJsonSchema = (): string => {
    const buildSchema = (fields: SchemaField[]) => {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      fields.forEach((field) => {
        if (!field.name) return;

        const prop: Record<string, unknown> = {};

        if (field.type === "object" && field.properties) {
          const nested = buildSchema(field.properties);
          prop.type = "object";
          prop.properties = nested.properties;
          if (nested.required.length > 0) {
            prop.required = nested.required;
          }
        } else if (field.type === "array" && field.items) {
          prop.type = "array";
          if (field.items.type === "object" && field.items.properties) {
            const itemSchema = buildSchema([field.items]);
            prop.items = {
              type: "object",
              properties: itemSchema.properties,
            };
          } else {
            prop.items = { type: field.items.type };
          }
        } else {
          prop.type = field.type;
        }

        if (field.description) {
          prop.description = field.description;
        }

        properties[field.name] = prop;
        if (field.required) {
          required.push(field.name);
        }
      });

      return { properties, required };
    };

    const schema = buildSchema(value);
    const output = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: schema.properties,
      ...(schema.required.length > 0 ? { required: schema.required } : {}),
    };

    return JSON.stringify(output, null, 2);
  };

  const renderField = (field: SchemaField, path: string[] = [], depth: number = 0) => {
    const isExpanded = expandedFields.has(field.id);
    const hasChildren = field.type === "object" && field.properties;

    return (
      <div key={field.id} className="space-y-2">
        <Card className="p-3 border-border/50 bg-card/30">
          <div className="flex items-start gap-3">
            {hasChildren && (
              <button
                onClick={() => toggleExpanded(field.id)}
                className="mt-2 text-muted-foreground hover:text-foreground"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}

            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    className="bg-input border-border/50 h-9"
                  />
                </div>

                <div>
                  <Input
                    placeholder="Description (optional)"
                    value={field.description || ""}
                    onChange={(e) => updateField(field.id, { description: e.target.value })}
                    className="bg-input border-border/50 text-sm h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-center">
                <div>
                  <Select
                    value={field.type}
                    onValueChange={(value) =>
                      updateField(field.id, { type: value as SchemaField["type"] })
                    }
                  >
                    <SelectTrigger className="bg-input border-border/50 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="object">Object</SelectItem>
                      <SelectItem value="array">Array</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.required}
                    onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                  />
                  <Badge
                    variant={field.required ? "default" : "outline"}
                    className={
                      field.required
                        ? "bg-primary/20 text-primary border-primary/30"
                        : "border-border/50"
                    }
                  >
                    {field.required ? "Required" : "Optional"}
                  </Badge>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteField(field.id)}
                    className="h-9 w-9 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {hasChildren && isExpanded && field.properties && (
          <div className="ml-8 space-y-2 border-l-2 border-border/30 pl-4">
            {field.properties.map((childField) =>
              renderField(childField, [...path, field.id], depth + 1)
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addField([...path, field.id])}
              className="mt-2"
            >
              <Plus className="h-3 w-3 mr-2" />
              Add nested field
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Schema Fields</Label>
        <Button type="button" onClick={() => addField()} size="sm" className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-auto">
        {value.length === 0 ? (
          <Card className="p-8 border-dashed border-border/50 bg-card/30">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No fields defined yet</p>
              <p className="text-xs mt-1">Click "Add Field" to start building your schema</p>
            </div>
          </Card>
        ) : (
          value.map((field) => renderField(field))
        )}
      </div>

      <div className="space-y-2">
        <Label>Generated JSON Schema</Label>
        <Textarea
          value={generateJsonSchema()}
          readOnly
          className="font-mono text-xs bg-muted/50 border-border/50 min-h-48"
        />
      </div>
    </div>
  );
}
