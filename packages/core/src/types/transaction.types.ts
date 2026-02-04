/**
 * Transaction data structure for fraud evaluation
 */
export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Result of fraud rule evaluation
 */
export interface RuleEvaluationResult {
  transactionId: string;
  score: number;
  flags: string[];
  timestamp: Date;
  ruleType: 'stateless' | 'velocity';
}
