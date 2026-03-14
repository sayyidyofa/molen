/**
 * Tests for Canvas Component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { Canvas } from './Canvas';
import { useBuilderStore } from '../../store/useBuilderStore';

// Wrapper component for ReactFlow
const CanvasWrapper = () => (
  <ReactFlowProvider>
    <div style={{ width: '800px', height: '600px' }}>
      <Canvas />
    </div>
  </ReactFlowProvider>
);

describe('Canvas Component', () => {
  beforeEach(() => {
    // Reset store before each test
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
      edges: [],
      selectedNode: null,
      executionState: 'idle',
      testResults: new Map(),
      currentTransaction: null,
    });
  });

  it('should render the Canvas component', () => {
    render(<CanvasWrapper />);
    
    // React Flow should render
    const reactFlowElement = document.querySelector('.react-flow');
    expect(reactFlowElement).toBeTruthy();
  });

  it('should render the initial Input node', () => {
    render(<CanvasWrapper />);
    
    // Check if the input node is in the store
    const state = useBuilderStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe('input-1');
    expect(state.nodes[0].data.label).toBe('Transaction Input');
  });

  it('should have Background component', () => {
    render(<CanvasWrapper />);
    
    // Check for background element
    const background = document.querySelector('.react-flow__background');
    expect(background).toBeTruthy();
  });

  it('should have Controls component', () => {
    render(<CanvasWrapper />);
    
    // Check for controls element
    const controls = document.querySelector('.react-flow__controls');
    expect(controls).toBeTruthy();
  });

  it('should have MiniMap component', () => {
    render(<CanvasWrapper />);
    
    // Check for minimap element
    const minimap = document.querySelector('.react-flow__minimap');
    expect(minimap).toBeTruthy();
  });
});
