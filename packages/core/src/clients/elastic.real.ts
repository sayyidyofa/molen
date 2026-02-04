import { Client } from '@elastic/elasticsearch';
import { readFileSync } from 'fs';
import { IElasticClient } from './elastic.interface';

/**
 * Real Elasticsearch client implementation with SSL/TLS support
 */
export class RealElasticClient implements IElasticClient {
  private client: Client;

  constructor(config: { node: string; caPath?: string }) {
    const clientConfig: any = {
      node: config.node,
    };

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

  async search(params: object): Promise<any> {
    return await this.client.search(params as any);
  }

  async index(params: object): Promise<any> {
    return await this.client.index(params as any);
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
