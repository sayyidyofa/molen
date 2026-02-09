import { IFlinkClient } from './flink.interface';

/**
 * Real Flink client implementation for stream processing
 */
export class RealFlinkClient implements IFlinkClient {
  private apiUrl: string;
  private headers: Record<string, string>;

  constructor(config: { 
    apiUrl: string;
    clientId?: string;
    clientSecret?: string;
  }) {
    this.apiUrl = config.apiUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };

    // Add Cloudflare Access headers if provided
    if (config.clientId && config.clientSecret) {
      this.headers['CF-Access-Client-Id'] = config.clientId;
      this.headers['CF-Access-Client-Secret'] = config.clientSecret;
    }
  }

  async submitJob(jobConfig: object): Promise<string> {
    const response = await fetch(`${this.apiUrl}/jars/upload`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(jobConfig),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit job: ${response.statusText}`);
    }

    const data = await response.json();
    return data.jobId || 'job-submitted';
  }

  async getJobStatus(jobId: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/jobs/${jobId}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }

    return await response.json();
  }

  async cancelJob(jobId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/jobs/${jobId}`, {
      method: 'PATCH',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel job: ${response.statusText}`);
    }
  }

  async close(): Promise<void> {
    // No persistent connection to close for REST API
  }

  /**
   * Get list of jobs - useful for testing connectivity
   */
  async listJobs(): Promise<any> {
    const response = await fetch(`${this.apiUrl}/jobs`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to list jobs: ${response.statusText}`);
    }

    return await response.json();
  }
}
