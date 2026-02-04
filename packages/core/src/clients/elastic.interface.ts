/**
 * Elasticsearch client interface for fraud alert storage and retrieval
 */
export interface IElasticClient {
  /**
   * Search for documents in Elasticsearch
   * @param params - Search parameters including index, query, etc.
   * @returns Promise with search results
   */
  search(params: object): Promise<any>;

  /**
   * Index a document in Elasticsearch
   * @param params - Index parameters including index, document, etc.
   * @returns Promise with index result
   */
  index(params: object): Promise<any>;

  /**
   * Close the client connection
   */
  close(): Promise<void>;
}
