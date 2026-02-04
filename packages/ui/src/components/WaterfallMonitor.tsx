import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

/**
 * Waterfall Monitor Component (REQ-3.1)
 * Real-time visualization of transaction flow
 */
export function WaterfallMonitor() {
  const [shadowMode, setShadowMode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  useEffect(() => {
    loadShadowMode();
  }, []);

  async function loadShadowMode() {
    try {
      const result = await apiClient.getShadowMode();
      setShadowMode(result.shadowMode);
    } catch (error) {
      console.error('Failed to load shadow mode:', error);
    }
  }

  async function toggleShadowMode() {
    try {
      const result = await apiClient.setShadowMode(!shadowMode);
      setShadowMode(result.shadowMode);
    } catch (error) {
      console.error('Failed to toggle shadow mode:', error);
    }
  }

  async function processTestTransaction() {
    setProcessing(true);
    try {
      const testTxn = {
        id: `txn-${Date.now()}`,
        userId: 'test-user',
        amount: Math.floor(Math.random() * 20000),
        timestamp: new Date(),
      };

      const result = await apiClient.processTransaction(testTxn);
      setLastResult(result);
    } catch (error) {
      console.error('Failed to process transaction:', error);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Waterfall Monitor</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          <input
            type="checkbox"
            checked={shadowMode}
            onChange={toggleShadowMode}
          />
          {' '}Shadow Mode (REQ-1.2)
        </label>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          {shadowMode 
            ? 'Logging fraud scores without interrupting flow' 
            : 'Active fraud detection mode'}
        </p>
      </div>

      <button 
        onClick={processTestTransaction}
        disabled={processing}
        style={{ padding: '10px 20px', marginBottom: '20px' }}
      >
        {processing ? 'Processing...' : 'Process Test Transaction'}
      </button>

      {lastResult && (
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h3>Last Transaction Result</h3>
          <p><strong>Transaction ID:</strong> {lastResult.transaction.id}</p>
          <p><strong>Amount:</strong> ${lastResult.transaction.amount}</p>
          <p><strong>Total Score:</strong> {lastResult.totalScore}</p>
          <p><strong>Flagged:</strong> {lastResult.flagged ? 'YES' : 'NO'}</p>
          
          <h4>Evaluation Results:</h4>
          {lastResult.results.map((result: any, idx: number) => (
            <div key={idx} style={{ marginLeft: '20px', marginBottom: '10px' }}>
              <p><strong>Rule Type:</strong> {result.ruleType}</p>
              <p><strong>Score:</strong> {result.score}</p>
              <p><strong>Flags:</strong> {result.flags.join(', ') || 'None'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
