/**
 * Zustand store for Builder state management
 */

import { create } from 'zustand';
import type { Node, Edge, Connection } from '@xyflow/react';
import type {
  MolenNodeData,
  ExecutionState,
  TestResult,
  Transaction,
} from '../types/molen';
import api from '../services/api';

interface BuilderState {
  // Graph state
  nodes: Node<MolenNodeData>[];
  edges: Edge[];

  // Selection state
  selectedNode: Node<MolenNodeData> | null;

  // Execution state
  executionState: ExecutionState;
  testResults: Map<string, TestResult>;
  currentTransaction: Transaction | null;

  // Actions
  setNodes: (nodes: Node<MolenNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node<MolenNodeData>) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: Partial<MolenNodeData>) => void;
  connectEdge: (connection: Connection) => void;
  setSelectedNode: (node: Node<MolenNodeData> | null) => void;

  // Test actions
  triggerNodeTest: (nodeId: string) => Promise<void>;
  clearTestResults: () => void;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  // Initial state
  nodes: [
    {
      id: 'input-1',
      type: 'input',
      position: { x: 250, y: 50 },
      data: {
        label: 'Transaction Input',
        nodeType: 'input',
        description: 'Receives incoming transactions',
      },
    },
  ],
  edges: [],
  selectedNode: null,
  executionState: 'idle',
  testResults: new Map(),
  currentTransaction: null,

  // Graph actions
  setNodes: (nodes) => set({ nodes }),
  
  setEdges: (edges) => set({ edges }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
    })),

  updateNode: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    })),

  connectEdge: (connection) => {
    const { source, target } = connection;
    if (!source || !target) return;

    const newEdge: Edge = {
      id: `edge-${source}-${target}`,
      source,
      target,
      type: 'smoothstep',
    };

    set((state) => ({
      edges: [...state.edges, newEdge],
    }));
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  // Test actions
  triggerNodeTest: async (nodeId) => {
    const state = get();
    const node = state.nodes.find((n) => n.id === nodeId);

    if (!node) {
      console.error('Node not found:', nodeId);
      return;
    }

    try {
      // Set testing state
      set({ executionState: 'testing' });

      // Generate or reuse transaction
      const transaction =
        state.currentTransaction || api.generateMockTransaction();
      
      if (!state.currentTransaction) {
        set({ currentTransaction: transaction });
      }

      // Call real API to test transaction
      const response = await api.testTransaction('default-graph', transaction);

      // Create test result from API response
      const testResult: TestResult = {
        nodeId,
        success: true,
        result: response.result,
        timestamp: new Date().toISOString(),
      };

      // Update results
      const newResults = new Map(state.testResults);
      newResults.set(nodeId, testResult);

      set({
        executionState: 'success',
        testResults: newResults,
      });
    } catch (error) {
      console.error('Test execution failed:', error);
      
      // Create error test result
      const errorResult: TestResult = {
        nodeId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };

      const newResults = new Map(state.testResults);
      newResults.set(nodeId, errorResult);

      set({ 
        executionState: 'error',
        testResults: newResults,
      });
    }
  },

  clearTestResults: () =>
    set({
      testResults: new Map(),
      executionState: 'idle',
      currentTransaction: null,
    }),
}));
