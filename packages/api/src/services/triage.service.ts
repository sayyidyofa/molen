import { IElasticClient, ExternalClientFactory } from '@molen/core';

/**
 * Service for case triage functionality
 * Implements REQ-3.3 (Case Triage view)
 */
export class TriageService {
  private elasticClient: IElasticClient;

  constructor() {
    this.elasticClient = ExternalClientFactory.createElasticClient();
  }

  /**
   * Get flagged transactions for triage
   */
  async getFlaggedTransactions(params?: {
    from?: number;
    size?: number;
    minScore?: number;
  }): Promise<any> {
    const result = await this.elasticClient.search({
      index: 'fraud-alerts',
      body: {
        query: {
          bool: {
            must: [
              { term: { flagged: true } },
            ],
            filter: params?.minScore ? [
              { range: { totalScore: { gte: params.minScore } } },
            ] : [],
          },
        },
        from: params?.from || 0,
        size: params?.size || 20,
        sort: [{ timestamp: 'desc' }],
      },
    });

    return {
      total: result.hits.total.value,
      cases: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        ...hit._source,
      })),
    };
  }

  /**
   * Get details for a specific case
   */
  async getCaseDetails(caseId: string): Promise<any> {
    const result = await this.elasticClient.search({
      index: 'fraud-alerts',
      body: {
        query: { ids: { values: [caseId] } },
      },
    });

    if (result.hits.hits.length === 0) {
      throw new Error('Case not found');
    }

    return {
      id: result.hits.hits[0]._id,
      ...result.hits.hits[0]._source,
    };
  }
}
