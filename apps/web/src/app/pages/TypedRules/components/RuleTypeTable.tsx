import { Trash2, Shield } from "lucide-react";
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
import { RuleTypeView, TypeColors } from "../../../types/ruleEngine";

export function RuleTypeTable({ ruleTypes, onDelete }: { ruleTypes: RuleTypeView[], onDelete: (id: string, name: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ruleTypes.map((rt) => {
          const colors = TypeColors[rt.baseType] || TypeColors.STRING;
          return (
            <TableRow key={rt.id}>
              <TableCell className="font-medium flex items-center gap-2">
                <Shield className={`h-4 w-4 ${colors.color}`} /> {rt.name}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`${colors.bg} ${colors.color} ${colors.border} text-[10px]`}>
                  {rt.baseType.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md truncate text-muted-foreground text-xs">{rt.description}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => onDelete(rt.id, rt.name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
