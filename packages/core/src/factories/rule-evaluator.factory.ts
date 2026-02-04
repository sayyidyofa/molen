import { IRuleEvaluator } from '../rules/rule-evaluator.interface';
import { StatelessRuleEvaluator } from '../rules/stateless-evaluator';
import { VelocityRuleEvaluator } from '../rules/velocity-evaluator';
import { ExternalClientFactory } from './client.factory';

/**
 * Configuration for rule evaluators
 */
export interface RuleEvaluatorConfig {
  stateless?: { highAmountThreshold?: number };
  velocity?: { transactionsPerMinute?: number; transactionsPerHour?: number };
}

/**
 * Factory for creating rule evaluators with different strategies
 * Implements REQ-1.1 from the SRS
 */
export class RuleEvaluatorFactory {
  /**
   * Create a stateless rule evaluator
   */
  static createStatelessEvaluator(config?: { highAmountThreshold?: number }): IRuleEvaluator {
    return new StatelessRuleEvaluator(config);
  }

  /**
   * Create a velocity rule evaluator
   * Automatically creates a Redis client for velocity tracking
   */
  static createVelocityEvaluator(config?: { transactionsPerMinute?: number; transactionsPerHour?: number }): IRuleEvaluator {
    const redisClient = ExternalClientFactory.createRedisClient();
    return new VelocityRuleEvaluator(redisClient, config);
  }

  /**
   * Create a combined evaluator that runs both stateless and velocity checks
   */
  static createCombinedEvaluator(config?: RuleEvaluatorConfig): IRuleEvaluator[] {
    return [
      this.createStatelessEvaluator(config?.stateless),
      this.createVelocityEvaluator(config?.velocity),
    ];
  }
}
