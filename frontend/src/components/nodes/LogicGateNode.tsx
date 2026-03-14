/**
 * Logic Gate Node Component
 */

import { Handle, Position } from '@xyflow/react';
import type { MolenNodeData } from '../../types/molen';

interface LogicGateNodeProps {
  data: MolenNodeData;
  selected?: boolean;
}

export function LogicGateNode({ data, selected }: LogicGateNodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
        ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">LG</span>
          </div>
          <div className="font-semibold text-sm text-gray-800">{data.label}</div>
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          {data.field && (
            <div>
              Field: <span className="font-mono">{data.field}</span>
            </div>
          )}
          {data.operator && data.threshold !== undefined && (
            <div>
              Rule: <span className="font-mono">{data.operator} {data.threshold}</span>
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
