/**
 * Canvas Component - Main React Flow canvas for graph building
 */

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useBuilderStore } from '../../store/useBuilderStore';
import { LogicGateNode } from '../nodes/LogicGateNode';
import { ModelNode } from '../nodes/ModelNode';

// Define custom node types
const nodeTypes: NodeTypes = {
  logic_gate: LogicGateNode,
  ml_model: ModelNode,
};

export function Canvas() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setSelectedNode,
    connectEdge,
  } = useBuilderStore();

  // Handle node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  // Handle edge connection
  const onConnect = useCallback(
    (connection: Connection) => {
      connectEdge(connection);
    },
    [connectEdge]
  );

  // Handle node drag end
  const onNodesChange = useCallback(
    (changes: any) => {
      // Update node positions
      const updatedNodes = nodes.map((node) => {
        const change = changes.find((c: any) => c.id === node.id);
        if (change && change.type === 'position' && change.position) {
          return {
            ...node,
            position: change.position,
          };
        }
        return node;
      });
      setNodes(updatedNodes);
    },
    [nodes, setNodes]
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: any) => {
      // Handle edge removal
      const updatedEdges = edges.filter((edge) => {
        const removeChange = changes.find(
          (c: any) => c.id === edge.id && c.type === 'remove'
        );
        return !removeChange;
      });
      setEdges(updatedEdges);
    },
    [edges, setEdges]
  );

  // Handle pane click (deselect node)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="bg-white"
        />
      </ReactFlow>
    </div>
  );
}
