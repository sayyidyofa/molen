import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Trash2 } from "lucide-react";
import {
  DataType,
  LogicBlock,
  LogicalOperator,
  TypeColors,
  TypeOperators,
} from "../../../types/ruleEngine";

interface LogicBlockRowProps {
  block: LogicBlock;
  index: number;
  variables: Array<{ path: string; type: DataType; label: string }>;
  onUpdate: (id: string, updates: Partial<LogicBlock>) => void;
  onDelete: (id: string) => void;
}

export function LogicBlockRow({ block, index, variables, onUpdate, onDelete }: LogicBlockRowProps) {
  const colors = TypeColors[block.variableType];
  const operators = TypeOperators[block.variableType] || [];

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg border border-border/40 bg-card/40">
      {index > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <Select value={block.connector} onValueChange={(v) => onUpdate(block.id, { connector: v as LogicalOperator })}>
            <SelectTrigger className="h-6 w-20 text-[10px] bg-muted uppercase font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={LogicalOperator.AND}>AND</SelectItem>
              <SelectItem value={LogicalOperator.OR}>OR</SelectItem>
            </SelectContent>
          </Select>
          <div className="h-px flex-1 bg-border/30" />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select value={block.variable} onValueChange={(v) => onUpdate(block.id, { variable: v })}>
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variables.map((v) => (
              <SelectItem key={v.path} value={v.path} className="text-xs">
                {v.path}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="outline" className={`${colors} text-[9px] h-5 px-1.5 border-none`}>
          {block.variableType.toUpperCase()}
        </Badge>

        <Select value={block.operator} onValueChange={(v) => onUpdate(block.id, { operator: v })}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op.value} value={op.value} className="text-xs">
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {block.operator !== "is_true" && block.operator !== "is_false" && (
          <Input
            value={block.value || ""}
            onChange={(e) => onUpdate(block.id, { value: e.target.value })}
            placeholder="Value..."
            className="h-8 w-32 text-xs"
          />
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(block.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
