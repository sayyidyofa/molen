import { IRuleEvaluator } from './rule-evaluator.interface';
import { Transaction, RuleEvaluationResult } from '../types/transaction.types';
import { IRedisClient } from '../clients/redis.interface';

/**
 * Velocity rule evaluator implementation
 * Evaluates transactions based on velocity patterns (frequency, rate, etc.)
 */
export class VelocityRuleEvaluator implements IRuleEvaluator {
  private redisClient: IRedisClient;
  private thresholds: {
    transactionsPerMinute: number;
    transactionsPerHour: number;
  };

  constructor(redisClient: IRedisClient, config?: { transactionsPerMinute?: number; transactionsPerHour?: number }) {
    this.redisClient = redisClient;
    this.thresholds = {
      transactionsPerMinute: config?.transactionsPerMinute || 10,
      transactionsPerHour: config?.transactionsPerHour || 50,
    };
  }

  async evaluate(transaction: Transaction): Promise<RuleEvaluationResult> {
    const flags: string[] = [];
    let score = 0;

    // Check velocity - transactions per minute
    const minuteKey = `velocity:${transaction.userId}:minute:${Math.floor(Date.now() / 60000)}`;
    const minuteCount = await this.redisClient.incr(minuteKey);
    await this.redisClient.set(minuteKey, minuteCount.toString(), 60);

    if (minuteCount > this.thresholds.transactionsPerMinute) {
      flags.push('HIGH_VELOCITY_MINUTE');
      score += 40;
    }

    // Check velocity - transactions per hour
    const hourKey = `velocity:${transaction.userId}:hour:${Math.floor(Date.now() / 3600000)}`;
    const hourCount = await this.redisClient.incr(hourKey);
    await this.redisClient.set(hourKey, hourCount.toString(), 3600);

    if (hourCount > this.thresholds.transactionsPerHour) {
      flags.push('HIGH_VELOCITY_HOUR');
      score += 30;
    }

    return {
      transactionId: transaction.id,
      score,
      flags,
      timestamp: new Date(),
      ruleType: 'velocity',
    };
  }

  getType(): 'velocity' {
    return 'velocity';
  }
}
