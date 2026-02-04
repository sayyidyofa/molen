import { IFlinkClient } from './flink.interface';

/**
 * Mock Flink client for testing without external dependencies
 */
export class MockFlinkClient implements IFlinkClient {
  private jobs: Map<string, any> = new Map();
  private jobCounter = 0;

  async submitJob(jobConfig: object): Promise<string> {
    this.jobCounter++;
    const jobId = `mock-job-${this.jobCounter}`;
    this.jobs.set(jobId, {
      id: jobId,
      config: jobConfig,
      status: 'RUNNING',
      submittedAt: new Date(),
    });
    return jobId;
  }

  async getJobStatus(jobId: string): Promise<any> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    return {
      id: job.id,
      status: job.status,
    };
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    job.status = 'CANCELED';
  }

  async close(): Promise<void> {
    // No-op for mock
  }

  // Helper method for testing
  clearJobs(): void {
    this.jobs.clear();
    this.jobCounter = 0;
  }
}
