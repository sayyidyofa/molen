/**
 * Sidebar Component - Properties and testing panel
 */

import { useBuilderStore } from '../../store/useBuilderStore';
import { Decision } from '../../types/molen';

export function Sidebar() {
  const {
    selectedNode,
    executionState,
    testResults,
    triggerNodeTest,
    addNode,
  } = useBuilderStore();

  const handleTestNode = () => {
    if (selectedNode) {
      triggerNodeTest(selectedNode.id);
    }
  };

  const handleAddLogicGate = () => {
    const newNode = {
      id: `logic-gate-${Date.now()}`,
      type: 'logic_gate',
      position: { x: 250, y: 150 },
      data: {
        label: 'Amount Check',
        nodeType: 'logic_gate' as const,
        field: 'amount',
        operator: 'gt' as const,
        threshold: 1000,
        description: 'Check if amount exceeds threshold',
      },
    };
    addNode(newNode);
  };

  const handleAddMLModel = () => {
    const newNode = {
      id: `ml-model-${Date.now()}`,
      type: 'ml_model',
      position: { x: 250, y: 300 },
      data: {
        label: 'Fraud Model',
        nodeType: 'ml_model' as const,
        modelType: 'xgboost' as const,
        modelVersion: 'v1.0',
        description: 'XGBoost fraud detection model',
      },
    };
    addNode(newNode);
  };

  const testResult = selectedNode
    ? testResults.get(selectedNode.id)
    : null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Node Properties</h2>
      </div>

      {/* Add Nodes Section */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add Nodes</h3>
        <div className="space-y-2">
          <button
            onClick={handleAddLogicGate}
            className="w-full px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors"
          >
            + Logic Gate
          </button>
          <button
            onClick={handleAddMLModel}
            className="w-full px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 transition-colors"
          >
            + ML Model
          </button>
        </div>
      </div>

      {/* Selected Node Section */}
      {selectedNode ? (
        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Node</h3>
            <div className="bg-gray-50 rounded p-3 space-y-2">
              <div className="text-sm">
                <span className="text-gray-500">Type:</span>{' '}
                <span className="font-mono text-gray-800">{selectedNode.data.nodeType}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Label:</span>{' '}
                <span className="text-gray-800">{selectedNode.data.label}</span>
              </div>
              {selectedNode.data.description && (
                <div className="text-sm">
                  <span className="text-gray-500">Description:</span>{' '}
                  <span className="text-gray-800">{selectedNode.data.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Test Node Button */}
          <div>
            <button
              onClick={handleTestNode}
              disabled={executionState === 'testing'}
              className={`
                w-full px-4 py-2 rounded font-medium transition-colors
                ${
                  executionState === 'testing'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }
              `}
            >
              {executionState === 'testing' ? 'Testing...' : 'Test Node'}
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Test Result</h3>
              <div className="bg-gray-50 rounded p-3 space-y-2">
                <div className="text-sm">
                  <span className="text-gray-500">Status:</span>{' '}
                  <span
                    className={`font-medium ${
                      testResult.success ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {testResult.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                {testResult.result && (
                  <>
                    <div className="text-sm">
                      <span className="text-gray-500">Decision:</span>{' '}
                      <span
                        className={`font-medium font-mono ${
                          testResult.result.decision === Decision.BLOCK
                            ? 'text-red-600'
                            : testResult.result.decision === Decision.FLAG
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}
                      >
                        {testResult.result.decision}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Fraud Score:</span>{' '}
                      <span className="font-mono text-gray-800">
                        {testResult.result.fraud_score.toFixed(3)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Reason:</span>{' '}
                      <span className="text-gray-800">{testResult.result.reason}</span>
                    </div>
                  </>
                )}
                {testResult.executionTime && (
                  <div className="text-sm">
                    <span className="text-gray-500">Execution Time:</span>{' '}
                    <span className="font-mono text-gray-800">
                      {testResult.executionTime}ms
                    </span>
                  </div>
                )}
                {testResult.error && (
                  <div className="text-sm">
                    <span className="text-gray-500">Error:</span>{' '}
                    <span className="text-red-600">{testResult.error}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-gray-500 text-center">
            Select a node to view properties and test execution
          </p>
        </div>
      )}
    </div>
  );
}
