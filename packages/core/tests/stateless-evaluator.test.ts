import { describe, test, expect } from 'bun:test';
import { StatelessRuleEvaluator } from '../src/rules/stateless-evaluator';
import { Transaction } from '../src/types/transaction.types';

describe('StatelessRuleEvaluator', () => {
  test('should flag high amount transactions', async () => {
    const evaluator = new StatelessRuleEvaluator({ highAmountThreshold: 5000 });
    
    const transaction: Transaction = {
      id: 'txn-001',
      userId: 'user-001',
      amount: 10000,
      timestamp: new Date(),
    };

    const result = await evaluator.evaluate(transaction);

    expect(result.score).toBeGreaterThan(0);
    expect(result.flags).toContain('HIGH_AMOUNT');
    expect(result.ruleType).toBe('stateless');
  });

  test('should not flag normal transactions', async () => {
    const evaluator = new StatelessRuleEvaluator({ highAmountThreshold: 10000 });
    
    const transaction: Transaction = {
      id: 'txn-002',
      userId: 'user-002',
      amount: 100,
      timestamp: new Date(),
    };

    const result = await evaluator.evaluate(transaction);

    expect(result.score).toBe(0);
    expect(result.flags).toHaveLength(0);
  });
});
