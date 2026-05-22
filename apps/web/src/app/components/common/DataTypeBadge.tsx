import { Badge } from "../ui/badge";
import { DataType, DataTypeColors } from "../../types/molen";
import { cn } from "../ui/utils";

interface DataTypeBadgeProps {
  dataType: DataType;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function DataTypeBadge({ dataType, className, size = "md" }: DataTypeBadgeProps) {
  const colors = DataTypeColors[dataType];

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
    lg: "text-sm px-2.5 py-1",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        colors.bg,
        colors.color,
        colors.border,
        sizeClasses[size],
        "font-mono uppercase tracking-wide",
        className
      )}
    >
      {dataType}
    </Badge>
  );
}
