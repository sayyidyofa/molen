import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import { RuleAction } from "@molen/shared-types";
import { LucideIcon, Shield, AlertTriangle, CheckCircle } from "lucide-react";

export const actionConfig: Record<RuleAction, { icon: LucideIcon, color: string, bg: string, border: string }> = {
  [RuleAction.BLOCK]: { icon: Shield, color: "text-red-500", bg: "bg-red-500/20", border: "border-red-500/50" },
  [RuleAction.REVIEW]: { icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/20", border: "border-yellow-500/50" },
  [RuleAction.ALLOW]: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/20", border: "border-green-500/50" },
};

export function ActionSelect({ value, onChange }: { value: RuleAction, onChange: (v: RuleAction) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="action">Action</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-input border-border/50"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.values(RuleAction).map((action) => {
            const config = actionConfig[action];
            const ActionIcon = config.icon;
            return (
              <SelectItem key={action} value={action}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${config.bg} ${config.color} ${config.border} flex items-center gap-1`}>
                    <ActionIcon className="h-3 w-3" /> {action}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
