import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Rule } from '../types/api.types';

/**
 * Rule Editor Component (REQ-3.2)
 * Interface to update fraud detection rule thresholds
 */
export function RuleEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  async function loadRules() {
    setLoading(true);
    try {
      const result = await apiClient.getRules();
      setRules(result.rules || []);
    } catch (error) {
      console.error('Failed to load rules:', error);
      // Create some default rules for demo
      setRules([
        { id: 'rule-1', name: 'High Amount Threshold', value: 10000, type: 'stateless' },
        { id: 'rule-2', name: 'Velocity Per Minute', value: 10, type: 'velocity' },
        { id: 'rule-3', name: 'Velocity Per Hour', value: 50, type: 'velocity' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function updateRuleValue(ruleId: string, newValue: number) {
    try {
      await apiClient.updateRule(ruleId, { value: newValue });
      setRules(rules.map(rule => 
        rule.id === ruleId ? { ...rule, value: newValue } : rule
      ));
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  }

  async function publishChanges() {
    setPublishing(true);
    try {
      await apiClient.publishRules();
    } catch (error) {
      console.error('Failed to publish rules:', error);
      alert('Failed to publish rules');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading rules...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Rule Editor</h2>
      <p>Update Postgres-stored thresholds and publish to the system</p>

      <div style={{ marginBottom: '20px' }}>
        {rules.map(rule => (
          <div 
            key={rule.id}
            style={{ 
              border: '1px solid #ddd', 
              padding: '15px', 
              marginBottom: '10px',
              borderRadius: '5px'
            }}
          >
            <h3>{rule.name}</h3>
            <p><strong>Type:</strong> {rule.type}</p>
            <div>
              <label>
                <strong>Value:</strong>{' '}
                <input
                  type="number"
                  value={rule.value}
                  onChange={(e) => updateRuleValue(rule.id, parseInt(e.target.value, 10))}
                  style={{ marginLeft: '10px', padding: '5px' }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={publishChanges}
        disabled={publishing}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: publishing ? 'not-allowed' : 'pointer'
        }}
      >
      </button>
    </div>
  );
}
