import { Edit, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { TypedRuleView, RuleTypeView, TypeColors } from "../../../types/ruleEngine";

export function TypedRuleTable({ 
  typedRules, 
  ruleTypes,
  onEdit, 
  onDelete 
}: { 
  typedRules: TypedRuleView[], 
  ruleTypes: RuleTypeView[],
  onEdit: (rule: TypedRuleView) => void, 
  onDelete: (id: string, name: string) => void 
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rule Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Priority</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {typedRules.map((rule) => {
          const ruleType = ruleTypes.find(rt => rt.id === rule.ruleTypeId);
          const colors = ruleType ? TypeColors[ruleType.baseType] : TypeColors.STRING;
          
          return (
            <TableRow key={rule.id}>
              <TableCell className="font-medium">{rule.name}</TableCell>
              <TableCell>
                {ruleType && (
                  <Badge variant="outline" className={`${colors.bg} ${colors.color} ${colors.border} text-[10px]`}>
                    {ruleType.name.toUpperCase()}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {rule.status === 'active' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
                  <span className="text-xs capitalize">{rule.status}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-xs">{rule.priority}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(rule)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(rule.id, rule.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
