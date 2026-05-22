import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  LogicBlock,
  DataType,
  TypeOperators,
  LogicalOperator,
  TypeColors,
  RuleTypeView,
} from "../../types/ruleEngine";
import { getVariablesForRuleType } from "../../state/ruleEngineState";

interface VisualLogicBuilderProps {
  ruleType: RuleTypeView;
  blocks: LogicBlock[];
  onChange: (blocks: LogicBlock[]) => void;
}

export function VisualLogicBuilder({ ruleType, blocks, onChange }: VisualLogicBuilderProps) {
  const variables = getVariablesForRuleType(ruleType);

  const addBlock = () => {
    const defaultVar = variables[0];
    const newBlock: LogicBlock = {
      id: `block-${Date.now()}`,
      variable: defaultVar.path,
      operator: TypeOperators[defaultVar.type][0].value,
      value: "",
      variableType: defaultVar.type,
      connector: LogicalOperator.AND,
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<LogicBlock>) => {
    const newBlocks = blocks.map((block) => {
      if (block.id === id) {
        // If variable changed, update the type and reset operator
        if (updates.variable) {
          const selectedVar = variables.find((v) => v.path === updates.variable);
          if (selectedVar) {
            return {
              ...block,
              ...updates,
              variableType: selectedVar.type,
              operator: TypeOperators[selectedVar.type][0].value,
            };
          }
        }

        // If operator changed to is_true or is_false, set value to null
        if (updates.operator && (updates.operator === "is_true" || updates.operator === "is_false")) {
          return { ...block, ...updates, value: null };
        }

        return { ...block, ...updates };
      }
      return block;
    });
    onChange(newBlocks);
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id));
  };

  const getAvailableOperators = (varType: DataType) => {
    return TypeOperators[varType] || [];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visual Logic Blocks</span>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs">
            No-Code
          </Badge>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={addBlock}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-3 w-3 mr-2" />
          Add Condition
        </Button>
      </div>

      <div className="space-y-2">
        {blocks.length === 0 ? (
          <Card className="p-8 border-dashed border-border/50 bg-card/30">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No logic blocks defined</p>
              <p className="text-xs mt-1">Click "Add Condition" to start building</p>
            </div>
          </Card>
        ) : (
          blocks.map((block, index) => {
            const colors = TypeColors[block.variableType];
            const operators = getAvailableOperators(block.variableType);

            return (
              <div key={block.id} className="space-y-2">
                <Card
                  className="p-4 border-border/50 bg-card/30 relative overflow-hidden"
                  style={{
                    boxShadow: `0 0 0 1px ${colors.border.replace("border-", "").replace("/50", "20")}`,
                  }}
                >
                  {/* Molen Wrap Gradient */}
                  <div
                    className="absolute inset-0 opacity-5"
                    style={{
                      background: `linear-gradient(135deg, ${
                        TypeColors[block.variableType].border.replace("border-", "").replace("/50", "")
                      } 0%, transparent 100%)`,
                    }}
                  />

                  <div className="relative space-y-3">
                    {/* Block Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">IF</span>
                        <Badge
                          variant="outline"
                          className={`${colors.bg} ${colors.color} ${colors.border} text-xs font-mono`}
                        >
                          {block.variableType}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBlock(block.id)}
                        className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Variable Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Variable</label>
                      <Select
                        value={block.variable}
                        onValueChange={(value) => updateBlock(block.id, { variable: value })}
                      >
                        <SelectTrigger className="bg-input border-border/50 h-9 font-mono text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {variables.map((v) => {
                            const vColors = TypeColors[v.type];
                            return (
                              <SelectItem key={v.path} value={v.path}>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-sm" style={{ color: "#10b981", fontWeight: 600 }}>
                                    {`{{${v.path}}}`}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className={`${vColors.bg} ${vColors.color} ${vColors.border} text-[10px]`}
                                  >
                                    {v.type}
                                  </Badge>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Operator Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Operator</label>
                      <Select
                        value={block.operator}
                        onValueChange={(value) => updateBlock(block.id, { operator: value })}
                      >
                        <SelectTrigger className="bg-input border-border/50 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              <div className="flex items-center gap-2">
                                <span>{op.label}</span>
                                {op.syntax && (
                                  <span className="text-xs font-mono" style={{ color: "#6366f1" }}>
                                    {op.syntax}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Value Input - Hide for boolean operators that don't need values */}
                    {block.operator !== "is_true" && block.operator !== "is_false" && (
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Value</label>
                        <Input
                          type={block.variableType === DataType.NUMBER ? "number" : "text"}
                          value={block.value || ""}
                          onChange={(e) => updateBlock(block.id, { value: e.target.value })}
                          placeholder={
                            block.variableType === DataType.NUMBER
                              ? "Enter number..."
                              : block.variableType === DataType.BOOLEAN
                              ? "true/false"
                              : "Enter value..."
                          }
                          className="bg-input border-border/50 h-9"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* Logical Connector */}
                {index < blocks.length - 1 && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="h-8 w-0.5 bg-gradient-to-b from-violet-500/50 to-transparent" />
                    <Select
                      value={block.connector}
                      onValueChange={(value: LogicalOperator) =>
                        updateBlock(block.id, { connector: value })
                      }
                    >
                      <SelectTrigger className="w-24 h-7 bg-violet-500/10 border-violet-500/30 text-xs font-mono">
                        <SelectValue>
                          <span style={{ color: "#a855f7", fontWeight: 700 }}>{block.connector}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={LogicalOperator.AND}>
                          <span className="font-mono" style={{ color: "#a855f7", fontWeight: 700 }}>
                            AND
                          </span>
                        </SelectItem>
                        <SelectItem value={LogicalOperator.OR}>
                          <span className="font-mono" style={{ color: "#a855f7", fontWeight: 700 }}>
                            OR
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="h-8 w-0.5 bg-gradient-to-b from-transparent to-violet-500/50" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Generated Expression Preview */}
      {blocks.length > 0 && (
        <Card className="p-3 bg-muted/30 border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Generated Expression:</div>
          <code className="text-xs font-mono" style={{ color: "#10b981", fontWeight: 600 }}>
            {blocks
              .map((block, i) => {
                const operator = TypeOperators[block.variableType].find(
                  (op) => op.value === block.operator
                );

                // Build expression without showing null values
                let expr = `{{${block.variable}}} ${operator?.syntax || block.operator}`;

                // Only append value if it's not null/undefined/empty
                if (block.value !== null && block.value !== undefined && block.value !== "") {
                  const formattedValue = typeof block.value === "string" ? `"${block.value}"` : block.value;
                  expr += ` ${formattedValue}`;
                }

                return i < blocks.length - 1
                  ? `${expr} ${block.connector?.toLowerCase()}`
                  : expr;
              })
              .join(" ")}
          </code>
        </Card>
      )}
    </div>
  );
}
