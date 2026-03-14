/**
 * ML Model Node Component
 */

import { Handle, Position } from '@xyflow/react';
import type { MolenNodeData } from '../../types/molen';

interface ModelNodeProps {
  data: MolenNodeData;
  selected?: boolean;
}

export function ModelNode({ data, selected }: ModelNodeProps) {
  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]
        ${selected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-300'}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
            <span className="text-xs font-bold text-purple-600">ML</span>
          </div>
          <div className="font-semibold text-sm text-gray-800">{data.label}</div>
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          {data.modelType && (
            <div>
              Type: <span className="font-mono">{data.modelType}</span>
            </div>
          )}
          {data.modelVersion && (
            <div>
              Version: <span className="font-mono">{data.modelVersion}</span>
            </div>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
