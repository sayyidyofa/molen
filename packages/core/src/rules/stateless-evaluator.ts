import { IRuleEvaluator } from './rule-evaluator.interface';
import { Transaction, RuleEvaluationResult } from '../types/transaction.types';

/**
 * Stateless rule evaluator implementation
 * Evaluates transactions based on static rules without considering historical data
 */
export class StatelessRuleEvaluator implements IRuleEvaluator {
  private thresholds: {
    highAmountThreshold: number;
    suspiciousPatterns: string[];
  };

  constructor(config?: { highAmountThreshold?: number }) {
    this.thresholds = {
      highAmountThreshold: config?.highAmountThreshold || 10000,
      suspiciousPatterns: ['test', 'fraud'],
    };
  }

  async evaluate(transaction: Transaction): Promise<RuleEvaluationResult> {
    const flags: string[] = [];
    let score = 0;

    // Check high amount
    if (transaction.amount > this.thresholds.highAmountThreshold) {
      flags.push('HIGH_AMOUNT');
      score += 30;
    }

    // Check for suspicious patterns in metadata
    if (transaction.metadata) {
      const metadataStr = JSON.stringify(transaction.metadata).toLowerCase();
      for (const pattern of this.thresholds.suspiciousPatterns) {
        if (metadataStr.includes(pattern)) {
          flags.push('SUSPICIOUS_METADATA');
          score += 20;
          break;
        }
      }
    }

    return {
      transactionId: transaction.id,
      score,
      flags,
      timestamp: new Date(),
      ruleType: 'stateless',
    };
  }

  getType(): 'stateless' {
    return 'stateless';
  }
}
