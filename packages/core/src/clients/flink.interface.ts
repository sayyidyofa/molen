/**
 * Flink client interface for stream processing operations
 */
export interface IFlinkClient {
  /**
   * Submit a job to Flink
   * @param jobConfig - Job configuration
   * @returns Promise with job ID
   */
  submitJob(jobConfig: object): Promise<string>;

  /**
   * Get job status
   * @param jobId - The job ID to check
   * @returns Promise with job status
   */
  getJobStatus(jobId: string): Promise<any>;

  /**
   * Cancel a running job
   * @param jobId - The job ID to cancel
   * @returns Promise with cancellation result
   */
  cancelJob(jobId: string): Promise<void>;

  /**
   * Close the client connection
   */
  close(): Promise<void>;
}
