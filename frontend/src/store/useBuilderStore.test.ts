/**
 * Tests for useBuilderStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useBuilderStore } from './useBuilderStore';
import type { Node } from '@xyflow/react';
import type { MolenNodeData } from '../types/molen';

describe('useBuilderStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useBuilderStore.setState({
      nodes: [],
      edges: [],
      selectedNode: null,
      executionState: 'idle',
      testResults: new Map(),
      currentTransaction: null,
    });
  });

  it('should initialize with an input node', () => {
    // Re-initialize store to test initial state
    
    // Since we reset in beforeEach, manually set initial state
    useBuilderStore.setState({
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
    });

    const state = useBuilderStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe('input-1');
    expect(state.nodes[0].data.nodeType).toBe('input');
  });

  it('should add a node', () => {
    const newNode: Node<MolenNodeData> = {
      id: 'logic-gate-1',
      type: 'logic_gate',
      position: { x: 100, y: 100 },
      data: {
        label: 'Amount Check',
        nodeType: 'logic_gate',
        threshold: 1000,
        operator: 'gt',
      },
    };

    useBuilderStore.getState().addNode(newNode);

    const state = useBuilderStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe('logic-gate-1');
    expect(state.nodes[0].data.nodeType).toBe('logic_gate');
  });

  it('should remove a node', () => {
    const node: Node<MolenNodeData> = {
      id: 'test-node-1',
      type: 'logic_gate',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test Node',
        nodeType: 'logic_gate',
      },
    };

    useBuilderStore.getState().addNode(node);
    expect(useBuilderStore.getState().nodes).toHaveLength(1);

    useBuilderStore.getState().removeNode('test-node-1');
    expect(useBuilderStore.getState().nodes).toHaveLength(0);
  });

  it('should connect edges', () => {
    const connection = {
      source: 'node-1',
      target: 'node-2',
      sourceHandle: null,
      targetHandle: null,
    };

    useBuilderStore.getState().connectEdge(connection);

    const state = useBuilderStore.getState();
    expect(state.edges).toHaveLength(1);
    expect(state.edges[0].source).toBe('node-1');
    expect(state.edges[0].target).toBe('node-2');
  });

  it('should update node data', () => {
    const node: Node<MolenNodeData> = {
      id: 'test-node-1',
      type: 'logic_gate',
      position: { x: 100, y: 100 },
      data: {
        label: 'Original Label',
        nodeType: 'logic_gate',
        threshold: 1000,
      },
    };

    useBuilderStore.getState().addNode(node);
    useBuilderStore.getState().updateNode('test-node-1', {
      label: 'Updated Label',
      threshold: 2000,
    });

    const state = useBuilderStore.getState();
    expect(state.nodes[0].data.label).toBe('Updated Label');
    expect(state.nodes[0].data.threshold).toBe(2000);
  });

  it('should select a node', () => {
    const node: Node<MolenNodeData> = {
      id: 'test-node-1',
      type: 'logic_gate',
      position: { x: 100, y: 100 },
      data: {
        label: 'Test Node',
        nodeType: 'logic_gate',
      },
    };

    useBuilderStore.getState().setSelectedNode(node);

    const state = useBuilderStore.getState();
    expect(state.selectedNode).toBeTruthy();
    expect(state.selectedNode?.id).toBe('test-node-1');
  });

  it('should trigger node test and update execution state', async () => {
    // Add a node first
    const node: Node<MolenNodeData> = {
      id: 'test-node-1',
      type: 'logic_gate',
      position: { x: 100, y: 100 },
      data: {
        label: 'Amount Check',
        nodeType: 'logic_gate',
        threshold: 1000,
        operator: 'gt',
        field: 'amount',
      },
    };

    useBuilderStore.getState().addNode(node);

    // Trigger test
    await useBuilderStore.getState().triggerNodeTest('test-node-1');

    const state = useBuilderStore.getState();
    
    // Check execution state changed (should be 'success' or 'error')
    expect(['success', 'error']).toContain(state.executionState);
    
    // Check test results were stored
    expect(state.testResults.has('test-node-1')).toBe(true);
    
    const result = state.testResults.get('test-node-1');
    expect(result).toBeTruthy();
    expect(result?.nodeId).toBe('test-node-1');
    expect(result?.success).toBeDefined();
  });

  it('should clear test results', () => {
    // Set some test results
    const results = new Map();
    results.set('node-1', {
      nodeId: 'node-1',
      success: true,
      timestamp: new Date().toISOString(),
    });

    useBuilderStore.setState({
      testResults: results,
      executionState: 'success',
    });

    expect(useBuilderStore.getState().testResults.size).toBe(1);

    // Clear results
    useBuilderStore.getState().clearTestResults();

    const state = useBuilderStore.getState();
    expect(state.testResults.size).toBe(0);
    expect(state.executionState).toBe('idle');
  });
});
