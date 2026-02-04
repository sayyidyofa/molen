import {
  Transaction,
  RuleEvaluationResult,
  ExternalClientFactory,
  RuleEvaluatorFactory,
  IRuleEvaluator,
  IElasticClient,
} from '@molen/core';

/**
 * Service for processing transactions through the fraud detection waterfall
 * Implements REQ-1.1 and REQ-1.2 (Shadow Mode)
 */
export class WaterfallService {
  private evaluators: IRuleEvaluator[];
  private elasticClient: IElasticClient;
  private shadowMode: boolean;

  constructor(shadowMode: boolean = false) {
    this.shadowMode = shadowMode;
    this.elasticClient = ExternalClientFactory.createElasticClient();
    
    // Create both stateless and velocity evaluators
    this.evaluators = RuleEvaluatorFactory.createCombinedEvaluator();
  }

  /**
   * Process a transaction through the waterfall
   * In shadow mode, logs results without interrupting flow
   */
  async processTransaction(transaction: Transaction): Promise<{
    transaction: Transaction;
    results: RuleEvaluationResult[];
    totalScore: number;
    flagged: boolean;
    shadowMode: boolean;
  }> {
    const results: RuleEvaluationResult[] = [];
    let totalScore = 0;

    // Run all evaluators
    for (const evaluator of this.evaluators) {
      const result = await evaluator.evaluate(transaction);
      results.push(result);
      totalScore += result.score;
    }

    const flagged = totalScore > 50; // Threshold for flagging

    // Log to Elasticsearch
    await this.elasticClient.index({
      index: 'fraud-alerts',
      document: {
        transaction,
        results,
        totalScore,
        flagged,
        shadowMode: this.shadowMode,
        timestamp: new Date(),
      },
    });

    return {
      transaction,
      results,
      totalScore,
      flagged,
      shadowMode: this.shadowMode,
    };
  }

  /**
   * Toggle shadow mode on/off (REQ-1.2)
   */
  setShadowMode(enabled: boolean): void {
    this.shadowMode = enabled;
  }

  /**
   * Get current shadow mode state
   */
  getShadowMode(): boolean {
    return this.shadowMode;
  }
}
