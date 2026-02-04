import { IElasticClient, ExternalClientFactory } from '@molen/core';
import { Rule, RuleUpdate } from '../types/api.types';

/**
 * Service for managing fraud detection rules
 * Implements REQ-3.2 (Rule Editor functionality)
 */
export class RuleService {
  private elasticClient: IElasticClient;

  constructor() {
    this.elasticClient = ExternalClientFactory.createElasticClient();
  }

  /**
   * Get all rules
   */
  async getRules(): Promise<Rule[]> {
    const result = await this.elasticClient.search({
      index: 'fraud-rules',
      body: {
        query: { match_all: {} },
      },
    });

    return result.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
    })) as Rule[];
  }

  /**
   * Update a rule threshold
   */
  async updateRule(ruleId: string, updates: RuleUpdate): Promise<Rule> {
    // In production, this would update Postgres and trigger LavinMQ broadcast
    await this.elasticClient.index({
      index: 'fraud-rules',
      id: ruleId,
      document: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return { id: ruleId, ...updates } as Rule;
  }

  /**
   * Publish rule changes (triggers LavinMQ broadcast)
   */
  async publishRules(): Promise<void> {
    // Placeholder for LavinMQ integration
    console.log('Publishing rule changes to LavinMQ...');
  }
}
