import { useState } from "react";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { SchemaField, DataType } from "../../types/molen";
import { FieldRow } from "./TypeSafeSchemaBuilder/FieldRow";

interface TypeSafeSchemaBuilderProps {
  value: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

export function TypeSafeSchemaBuilder({ value, onChange }: TypeSafeSchemaBuilderProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(() => new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(id)) { newExpanded.delete(id); } else { newExpanded.add(id); }
    setExpandedFields(newExpanded);
  };

  const getFieldByPath = (fields: SchemaField[], path: string[]): SchemaField | null => {
    let current: SchemaField[] = fields;
    let field: SchemaField | null = null;
    for (const id of path) {
      field = current.find((f) => f.id === id) || null;
      if (!field) return null;
      if (field.properties) current = field.properties;
    }
    return field;
  };

  const addField = (parentPath: string[] = []) => {
    const newField: SchemaField = { id: `field-${Date.now()}`, name: "", dataType: DataType.STRING, required: false };
    const newFields = [...value];
    if (parentPath.length === 0) {
      newFields.push(newField);
    } else {
      const parent = getFieldByPath(newFields, parentPath);
      if (parent && parent.dataType === DataType.OBJECT) {
        if (!parent.properties) parent.properties = [];
        parent.properties.push(newField);
      }
    }
    onChange(newFields);
  };

  const updateField = (id: string, updates: Partial<SchemaField>) => {
    const newFields = [...value];
    const updateRecursive = (fields: SchemaField[]): boolean => {
      for (let i = 0; i < fields.length; i++) {
        if (fields[i].id === id) {
          fields[i] = { ...fields[i], ...updates };
          if (updates.dataType === DataType.OBJECT && !fields[i].properties) fields[i].properties = [];
          if (updates.dataType === DataType.ARRAY && !fields[i].items) {
            fields[i].items = { id: `${id}-items`, name: "items", dataType: DataType.STRING, required: false };
          }
          return true;
        }
        if (fields[i].properties && updateRecursive(fields[i].properties!)) return true;
      }
      return false;
    };
    updateRecursive(newFields);
    onChange(newFields);
  };

  const deleteField = (id: string) => {
    const deleteRecursive = (fields: SchemaField[]): SchemaField[] => {
      return fields.filter((field) => {
        if (field.id === id) return false;
        if (field.properties) field.properties = deleteRecursive(field.properties);
        return true;
      });
    };
    onChange(deleteRecursive([...value]));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Schema Fields</h3>
        <Button variant="outline" size="sm" onClick={() => addField()} className="h-8">
          <Plus className="mr-2 h-4 w-4" /> Add Top-Level Field
        </Button>
      </div>

      <div className="border rounded-lg p-4 bg-card/50 space-y-4">
        {value.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs italic">No fields defined yet.</div>
        ) : (
          <div className="space-y-4">
            {value.map((field) => (
              <FieldRow
                key={field.id}
                field={field}
                depth={0}
                path={[]}
                isExpanded={expandedFields.has(field.id)}
                onToggle={toggleExpanded}
                onUpdate={updateField}
                onDelete={deleteField}
                onAddChild={addField}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
