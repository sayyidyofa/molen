import { Client, ClientOptions } from '@elastic/elasticsearch';
import { readFileSync } from 'fs';
import { IElasticClient, ElasticsearchResponse, SearchParams, IndexParams } from './elastic.interface';

/**
 * Real Elasticsearch client implementation with SSL/TLS support
 */
export class RealElasticClient implements IElasticClient {
  private client: Client;

  constructor(config: { 
    node: string; 
    caPath?: string;
    username?: string;
    password?: string;
  }) {
    const clientConfig: ClientOptions = {
      node: config.node,
    };

    // Add basic auth if credentials are provided
    if (config.username && config.password) {
      clientConfig.auth = {
        username: config.username,
        password: config.password,
      };
    }

    // Add SSL/TLS configuration if CA certificate path is provided (REQ-2.3)
    if (config.caPath) {
      try {
        clientConfig.tls = {
          ca: readFileSync(config.caPath),
          rejectUnauthorized: true,
        };
      } catch (error) {
        console.error(`Failed to load CA certificate from ${config.caPath}:`, error);
        throw error;
      }
    }

    this.client = new Client(clientConfig);
  }

  async search<T = unknown>(params: SearchParams): Promise<ElasticsearchResponse<T>> {
    const result = await this.client.search({
      index: params.index,
      ...params.body,
    });
    return result as unknown as ElasticsearchResponse<T>;
  }

  async index(params: IndexParams): Promise<{ result: string; _id: string }> {
    const result = await this.client.index({
      index: params.index,
      id: params.id,
      document: params.document,
    });
    return {
      result: result.result,
      _id: result._id,
    };
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
