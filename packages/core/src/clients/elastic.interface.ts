/**
 * Elasticsearch client interface for fraud alert storage and retrieval
 */

export interface ElasticsearchResponse<T = unknown> {
  hits: {
    total: { value: number };
    hits: Array<{
      _id: string;
      _source: T;
      _score?: number;
    }>;
  };
}

export interface SearchParams {
  index: string;
  body?: {
    query?: unknown;
    from?: number;
    size?: number;
    sort?: unknown[];
  };
}

export interface IndexParams {
  index: string;
  id?: string;
  document?: unknown;
}

export interface IElasticClient {
  /**
   * Search for documents in Elasticsearch
   * @param params - Search parameters including index, query, etc.
   * @returns Promise with search results
   */
  search<T = unknown>(params: SearchParams): Promise<ElasticsearchResponse<T>>;

  /**
   * Index a document in Elasticsearch
   * @param params - Index parameters including index, document, etc.
   * @returns Promise with index result
   */
  index(params: IndexParams): Promise<{ result: string; _id: string }>;

  /**
   * Close the client connection
   */
  close(): Promise<void>;
}
