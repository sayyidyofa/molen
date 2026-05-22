import { Handle, Position } from "@xyflow/react";
import { Badge } from "../ui/badge";

// ─── Type config ─────────────────────────────────────────────────────────────

export const AGG_TYPE_CONFIG = {
  SUM: {
    symbol: "∑",
    label: "SUM",
    category: "math",
    allowedInputType: "NUMBER",
    outputType: "NUMBER",
    handleColor: "#22c55e",
    glowColor: "rgba(34,197,94,0.55)",
    borderTw: "#22c55e",
    badgeTw: "border-green-500/50 text-green-400 bg-green-500/10",
    headerTw: "text-green-400",
    desc: "Numeric sum of all inputs",
  },
  MAX: {
    symbol: "↑",
    label: "MAX",
    category: "math",
    allowedInputType: "NUMBER",
    outputType: "NUMBER",
    handleColor: "#22c55e",
    glowColor: "rgba(34,197,94,0.55)",
    borderTw: "#22c55e",
    badgeTw: "border-green-500/50 text-green-400 bg-green-500/10",
    headerTw: "text-green-400",
    desc: "Highest value of all inputs",
  },
  MIN: {
    symbol: "↓",
    label: "MIN",
    category: "math",
    allowedInputType: "NUMBER",
    outputType: "NUMBER",
    handleColor: "#22c55e",
    glowColor: "rgba(34,197,94,0.55)",
    borderTw: "#22c55e",
    badgeTw: "border-green-500/50 text-green-400 bg-green-500/10",
    headerTw: "text-green-400",
    desc: "Lowest value of all inputs",
  },
  AVG: {
    symbol: "x̄",
    label: "AVG",
    category: "math",
    allowedInputType: "NUMBER",
    outputType: "NUMBER",
    handleColor: "#22c55e",
    glowColor: "rgba(34,197,94,0.55)",
    borderTw: "#22c55e",
    badgeTw: "border-green-500/50 text-green-400 bg-green-500/10",
    headerTw: "text-green-400",
    desc: "Arithmetic mean of all inputs",
  },
  AND: {
    symbol: "∧",
    label: "AND",
    category: "logic",
    allowedInputType: "BOOLEAN",
    outputType: "BOOLEAN",
    handleColor: "#a855f7",
    glowColor: "rgba(168,85,247,0.55)",
    borderTw: "#a855f7",
    badgeTw: "border-purple-500/50 text-purple-400 bg-purple-500/10",
    headerTw: "text-purple-400",
    desc: "True only when all inputs are true",
  },
  OR: {
    symbol: "∨",
    label: "OR",
    category: "logic",
    allowedInputType: "BOOLEAN",
    outputType: "BOOLEAN",
    handleColor: "#a855f7",
    glowColor: "rgba(168,85,247,0.55)",
    borderTw: "#a855f7",
    badgeTw: "border-purple-500/50 text-purple-400 bg-purple-500/10",
    headerTw: "text-purple-400",
    desc: "True when any input is true",
  },
} as const;

export type AggType = keyof typeof AGG_TYPE_CONFIG;

const OCTAGON =
  "polygon(14px 0%, calc(100% - 14px) 0%, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0% calc(100% - 14px), 0% 14px)";

// ─── Node ─────────────────────────────────────────────────────────────────────

interface LogicAggregatorNodeProps {
  data: {
    label: string;
    aggType: AggType;
    connectionCount?: number;
    selected?: boolean;
  };
  selected?: boolean;
}

export function LogicAggregatorNode({ data, selected }: LogicAggregatorNodeProps) {
  const cfg = AGG_TYPE_CONFIG[data.aggType ?? "SUM"];
  const connCount = data.connectionCount ?? 0;

  return (
    <>
      {/* Inject pulsing animation for the N-ary handle */}
      <style>{`
        @keyframes naryPulse {
          0%, 100% { box-shadow: 0 0 0 2px ${cfg.handleColor}40, 0 0 10px 3px ${cfg.glowColor}; }
          50%       { box-shadow: 0 0 0 5px ${cfg.handleColor}25, 0 0 20px 7px ${cfg.glowColor}; }
        }
        @keyframes invalidDash {
          to { stroke-dashoffset: -20; }
        }
        .react-flow__edge.invalid-edge .react-flow__edge-path {
          stroke-dasharray: 8 4;
          animation: invalidDash 0.35s linear infinite;
        }
      `}</style>

      {/* drop-shadow wrapper — follows clip-path shape */}
      <div style={{ filter: `drop-shadow(0 0 ${selected ? "18px" : "10px"} ${cfg.glowColor})` }}>
        <div
          style={{
            clipPath: OCTAGON,
            background: `linear-gradient(135deg, #080d1a 0%, #0d1527 100%)`,
            border: `1.5px solid ${cfg.handleColor}60`,
            width: 192,
          }}
        >
          {/* Header strip */}
          <div
            className="flex items-center justify-between px-3 pt-2.5 pb-1"
            style={{ borderBottom: `1px solid ${cfg.handleColor}25` }}
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.headerTw}`}>
                {cfg.category === "math" ? "Math" : "Logic"}
              </span>
              <span className="text-[10px] text-muted-foreground/50">·</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.headerTw}`}>
                {cfg.label}
              </span>
            </div>
            <Badge
              variant="outline"
              className={`text-[8px] px-1 py-0 leading-tight ${cfg.badgeTw}`}
            >
              N→1
            </Badge>
          </div>

          {/* Operator symbol */}
          <div className="flex flex-col items-center justify-center py-3 gap-1">
            <span
              className="font-mono font-black leading-none select-none"
              style={{
                fontSize: 42,
                color: cfg.handleColor,
                textShadow: `0 0 20px ${cfg.glowColor}`,
                letterSpacing: "-0.02em",
              }}
            >
              {cfg.symbol}
            </span>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${cfg.headerTw} opacity-60`}>
              {cfg.label}
            </span>
          </div>

          {/* Footer — type badges + conn count */}
          <div
            className="flex items-center justify-between px-3 pb-2.5 pt-1"
            style={{ borderTop: `1px solid ${cfg.handleColor}25` }}
          >
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={`text-[8px] px-1 py-0 leading-tight ${cfg.badgeTw}`}>
                {cfg.allowedInputType}
              </Badge>
              <span className="text-[9px] text-muted-foreground/40">→</span>
              <Badge variant="outline" className={`text-[8px] px-1 py-0 leading-tight ${cfg.badgeTw}`}>
                {cfg.outputType}
              </Badge>
            </div>
            {connCount > 0 && (
              <span className="text-[9px] text-muted-foreground/50 font-mono">
                {connCount}×
              </span>
            )}
          </div>
        </div>
      </div>

      {/* N-ary input socket — large, pulsing */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: cfg.handleColor,
          border: `2px solid ${cfg.handleColor}`,
          animation: "naryPulse 2.2s ease-in-out infinite",
          left: -10,
        }}
      />

      {/* N→1 label beside the socket */}
      <div
        className="absolute text-[8px] font-mono text-muted-foreground/50 select-none pointer-events-none"
        style={{ left: 14, top: "50%", transform: "translateY(-50%)" }}
      >
        N
      </div>

      {/* Output handle — color-matched to output DataType */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: cfg.handleColor,
          border: `2px solid ${cfg.handleColor}80`,
          boxShadow: `0 0 8px 2px ${cfg.glowColor}`,
          right: -7,
        }}
      />
    </>
  );
}
