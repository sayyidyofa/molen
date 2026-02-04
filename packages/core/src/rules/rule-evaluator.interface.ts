import { Transaction, RuleEvaluationResult } from '../types/transaction.types';

/**
 * Interface for rule evaluation (REQ-1.1)
 * Supports interchangeable "Stateless" and "Velocity" logic
 */
export interface IRuleEvaluator {
  /**
   * Evaluate a transaction against fraud rules
   * @param transaction - The transaction to evaluate
   * @returns Promise with evaluation result including score and flags
   */
  evaluate(transaction: Transaction): Promise<RuleEvaluationResult>;

  /**
   * Get the type of rule evaluator
   */
  getType(): 'stateless' | 'velocity';
}
