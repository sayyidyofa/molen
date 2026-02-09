import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { RealFlinkClient } from '../../src/clients/flink.real';

// Integration tests only run when credentials are provided
const FLINK_URL = process.env.FLINK_URL;
const FLINK_CLIENT_ID = process.env.FLINK_CLIENT_ID;
const FLINK_CLIENT_SECRET = process.env.FLINK_CLIENT_SECRET;

const shouldRun = FLINK_URL && FLINK_CLIENT_ID && FLINK_CLIENT_SECRET;

describe.skipIf(!shouldRun)('RealFlinkClient Integration', () => {
  let client: RealFlinkClient;

  beforeAll(() => {
    client = new RealFlinkClient({
      apiUrl: FLINK_URL!,
      clientId: FLINK_CLIENT_ID,
      clientSecret: FLINK_CLIENT_SECRET,
    });
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
  });

  test('should connect to Flink and list jobs', async () => {
    // Test connectivity by listing jobs
    const result = await (client as any).listJobs();
    
    expect(result).toBeDefined();
    // Flink API should return jobs array or similar structure
    expect(result.jobs || result).toBeDefined();
  });

  test('should get job status (if jobs exist)', async () => {
    const jobsList = await (client as any).listJobs();
    
    // Only test getJobStatus if there are jobs
    if (jobsList.jobs && jobsList.jobs.length > 0) {
      const firstJobId = jobsList.jobs[0].id;
      const status = await client.getJobStatus(firstJobId);
      
      expect(status).toBeDefined();
      expect(status.state || status.status).toBeDefined();
    } else {
      console.log('No jobs available to test getJobStatus');
      // This is not a failure - just no jobs to test
      expect(true).toBe(true);
    }
  });
});

if (!shouldRun) {
  console.log('⚠️  Flink integration tests skipped. Set FLINK_URL, FLINK_CLIENT_ID, and FLINK_CLIENT_SECRET to run.');
}
