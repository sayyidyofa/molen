import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { FlaggedCase } from '../types/api.types';

/**
 * Case Triage Component (REQ-3.3)
 * View of flagged transactions for investigation
 */
export function CaseTriage() {
  const [cases, setCases] = useState<FlaggedCase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<FlaggedCase | null>(null);
  const [minScore, setMinScore] = useState(50);

  useEffect(() => {
    loadCases();
  }, [minScore]);

  async function loadCases() {
    setLoading(true);
    try {
      const result = await apiClient.getFlaggedCases({ 
        from: 0, 
        size: 20,
        minScore 
      });
      setCases(result.cases || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to load cases:', error);
      // Mock some data for demo
      setCases([
        {
          id: 'case-1',
          transaction: { id: 'txn-001', userId: 'user-123', amount: 15000, timestamp: new Date().toISOString() },
          totalScore: 70,
          flagged: true,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'case-2',
          transaction: { id: 'txn-002', userId: 'user-456', amount: 8000, timestamp: new Date().toISOString() },
          totalScore: 60,
          flagged: true,
          timestamp: new Date().toISOString(),
        },
      ]);
      setTotal(2);
    } finally {
      setLoading(false);
    }
  }

  async function viewCaseDetails(caseId: string) {
    try {
      const details = await apiClient.getCaseDetails(caseId);
      setSelectedCase(details);
    } catch (error) {
      console.error('Failed to load case details:', error);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Case Triage</h2>
      <p>Flagged transactions requiring investigation</p>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <strong>Minimum Score:</strong>{' '}
          <input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>

      {loading ? (
        <p>Loading cases...</p>
      ) : (
        <>
          <p><strong>Total Cases:</strong> {total}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h3>Flagged Cases</h3>
              {cases.map(caseItem => (
                <div
                  key={caseItem.id}
                  style={{
                    border: '1px solid #ddd',
                    padding: '10px',
                    marginBottom: '10px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    backgroundColor: selectedCase?.id === caseItem.id ? '#f0f0f0' : 'white'
                  }}
                  onClick={() => viewCaseDetails(caseItem.id)}
                >
                  <p><strong>Transaction ID:</strong> {caseItem.transaction.id}</p>
                  <p><strong>User:</strong> {caseItem.transaction.userId}</p>
                  <p><strong>Amount:</strong> ${caseItem.transaction.amount}</p>
                  <p><strong>Fraud Score:</strong> {caseItem.totalScore}</p>
                  <p style={{ fontSize: '0.9em', color: '#666' }}>
                    {new Date(caseItem.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div>
              {selectedCase ? (
                <>
                  <h3>Case Details</h3>
                  <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                    <p><strong>Case ID:</strong> {selectedCase.id}</p>
                    <p><strong>Transaction ID:</strong> {selectedCase.transaction.id}</p>
                    <p><strong>User ID:</strong> {selectedCase.transaction.userId}</p>
                    <p><strong>Amount:</strong> ${selectedCase.transaction.amount}</p>
                    <p><strong>Total Score:</strong> {selectedCase.totalScore}</p>
                    
                    <h4>Evaluation Results:</h4>
                    {selectedCase.results?.map((result: any, idx: number) => (
                      <div key={idx} style={{ marginLeft: '20px', marginBottom: '10px' }}>
                        <p><strong>Rule Type:</strong> {result.ruleType}</p>
                        <p><strong>Score:</strong> {result.score}</p>
                        <p><strong>Flags:</strong> {result.flags.join(', ') || 'None'}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p>Select a case to view details</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
