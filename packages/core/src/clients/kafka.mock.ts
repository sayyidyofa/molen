import {
  IKafkaConnectClient,
  PipelineConfig,
  PipelineStatus,
  KafkaConnectConfig,
} from './kafka.interface';

/**
 * Mock implementation of Redpanda Connect client for testing
 */
export class MockKafkaConnectClient implements IKafkaConnectClient {
  private pipelines: Map<string, PipelineConfig> = new Map();
  private statuses: Map<string, PipelineStatus> = new Map();

  constructor(_config: KafkaConnectConfig) {
    // Mock constructor - no actual connection
  }

  async deployPipeline(config: PipelineConfig): Promise<void> {
    this.pipelines.set(config.name, config);
    this.statuses.set(config.name, {
      name: config.name,
      status: config.enabled ? 'running' : 'stopped',
      uptime: 0,
      messagesProcessed: 0,
    });
  }

  async getPipelineStatus(name: string): Promise<PipelineStatus> {
    const status = this.statuses.get(name);
    if (!status) {
      throw new Error(`Pipeline ${name} not found`);
    }
    return status;
  }

  async listPipelines(): Promise<PipelineStatus[]> {
    return Array.from(this.statuses.values());
  }

  async reloadPipeline(name: string): Promise<void> {
    const status = this.statuses.get(name);
    if (!status) {
      throw new Error(`Pipeline ${name} not found`);
    }
    // Simulate reload by resetting counters
    status.uptime = 0;
    status.messagesProcessed = 0;
  }

  async stopPipeline(name: string): Promise<void> {
    const status = this.statuses.get(name);
    if (!status) {
      throw new Error(`Pipeline ${name} not found`);
    }
    status.status = 'stopped';
  }

  async startPipeline(name: string): Promise<void> {
    const status = this.statuses.get(name);
    if (!status) {
      throw new Error(`Pipeline ${name} not found`);
    }
    status.status = 'running';
    status.uptime = 0;
  }

  async close(): Promise<void> {
    // Mock close - no cleanup needed
  }

  // Test utility methods
  clearMockData(): void {
    this.pipelines.clear();
    this.statuses.clear();
  }

  getMockPipeline(name: string): PipelineConfig | undefined {
    return this.pipelines.get(name);
  }
}
