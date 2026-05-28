import { type DragEvent } from "react";
import { GripVertical } from "lucide-react";
import { Badge } from "../../../components/ui/badge";
import { DRAG_KEY } from "../types";

export function PaletteItem({
  iconNode,
  label,
  sublabel,
  badgeText,
  badgeClass,
  nodeType,
  nodeData,
  accentClass = "",
}: {
  iconNode?: React.ReactNode;
  label: string;
  sublabel: string;
  badgeText: string;
  badgeClass: string;
  nodeType: string;
  nodeData: Record<string, unknown>;
  accentClass?: string;
}) {
  const onDragStart = (e: DragEvent) => {
    e.dataTransfer.setData(DRAG_KEY, JSON.stringify({ nodeType, nodeData }));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`group flex items-center gap-2 rounded-lg border border-border/30 bg-card/40 px-2 py-1.5 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:bg-primary/5 transition-all select-none ${accentClass}`}
    >
      <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      {iconNode && (
        <div className="shrink-0">{iconNode}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate leading-tight">{label}</div>
        <div className="text-[9px] text-muted-foreground truncate leading-tight">{sublabel}</div>
      </div>
      <Badge variant="outline" className={`text-[8px] px-1 py-0 shrink-0 ${badgeClass}`}>
        {badgeText}
      </Badge>
    </div>
  );
}

export function AggSymbol({
  symbol,
  color,
}: {
  symbol: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center justify-center rounded w-6 h-6 font-mono font-black text-sm shrink-0"
      style={{ background: `${color}18`, color, border: `1px solid ${color}50` }}
    >
      {symbol}
    </div>
  );
}
