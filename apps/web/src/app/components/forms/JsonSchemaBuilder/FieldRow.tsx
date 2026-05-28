import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { Switch } from "../../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Plus, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { SchemaField } from "@molen/shared-types";

interface FieldRowProps {
  field: SchemaField;
  depth: number;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SchemaField>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentPath: string[]) => void;
  path: string[];
}

export function FieldRow({
  field,
  depth,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddChild,
  path,
}: FieldRowProps) {
  const hasChildren = field.type === "object";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 group">
        <div style={{ width: `${depth * 20}px` }} className="shrink-0" />
        
        {hasChildren ? (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onToggle(field.id)}>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="w-6" />
        )}

        <Input
          value={field.name}
          onChange={(e) => onUpdate(field.id, { name: e.target.value })}
          placeholder="Field name"
          className="h-8 text-xs bg-muted/50"
        />

        <Select
          value={field.type}
          onValueChange={(v) => onUpdate(field.id, { type: v as "string" | "number" | "boolean" | "object" | "array" })}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["string", "number", "boolean", "object", "array"].map((type) => (
              <SelectItem key={type} value={type} className="text-xs">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 px-2 shrink-0">
          <span className="text-[10px] text-muted-foreground uppercase">Req</span>
          <Switch
            checked={field.required}
            onCheckedChange={(v) => onUpdate(field.id, { required: v })}
            className="scale-75"
          />
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {hasChildren && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild([...path, field.id])}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(field.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && field.properties && (
        <div className="space-y-2 border-l border-border/40 ml-3 pl-3">
          {field.properties.map((child) => (
            <FieldRow
              key={child.id}
              field={child}
              depth={depth + 1}
              isExpanded={isExpanded}
              onToggle={onToggle}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              path={[...path, field.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
