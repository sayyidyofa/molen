import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Plus } from "lucide-react";
import {
  LogicBlock,
  TypeOperators,
  LogicalOperator,
  RuleTypeView,
} from "../../types/ruleEngine";
import { getVariablesForRuleType } from "../../state/ruleEngineState";
import { LogicBlockRow } from "./VisualLogicBuilder/LogicBlockRow";

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visual Logic Blocks</span>
          <Badge variant="outline" className="border-primary/30 text-primary text-xs">No-Code</Badge>
        </div>
        <Button type="button" size="sm" onClick={addBlock} className="bg-primary hover:bg-primary/90">
          <Plus className="h-3 w-3 mr-2" /> Add Condition
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
          blocks.map((block, index) => (
            <LogicBlockRow
              key={block.id}
              block={block}
              index={index}
              variables={variables}
              onUpdate={updateBlock}
              onDelete={deleteBlock}
            />
          ))
        )}
      </div>
    </div>
  );
}
