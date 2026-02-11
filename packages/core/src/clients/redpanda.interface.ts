/**
 * Redpanda Connect client interface
 * Manages Redpanda Connect pipelines for the waterfall engine
 */

export interface RedpandaConnectConfig {
  apiUrl: string;
  apiKey?: string;
}

export interface PipelineConfig {
  name: string;
  yaml: string;
  enabled: boolean;
}

export interface PipelineStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime?: number;
  messagesProcessed?: number;
  lastError?: string;
}

/**
 * IRedpandaConnectClient - Interface for Redpanda Connect operations
 * Replaces direct Flink integration for flexible waterfall processing
 */
export interface IRedpandaConnectClient {
  /**
   * Deploy or update a pipeline configuration
   */
  deployPipeline(config: PipelineConfig): Promise<void>;

  /**
   * Get status of a specific pipeline
   */
  getPipelineStatus(name: string): Promise<PipelineStatus>;

  /**
   * List all pipelines
   */
  listPipelines(): Promise<PipelineStatus[]>;

  /**
   * Reload a pipeline (e.g., after rule changes)
   */
  reloadPipeline(name: string): Promise<void>;

  /**
   * Stop a pipeline
   */
  stopPipeline(name: string): Promise<void>;

  /**
   * Start a pipeline
   */
  startPipeline(name: string): Promise<void>;

  /**
   * Close the client connection
   */
  close(): Promise<void>;
}
