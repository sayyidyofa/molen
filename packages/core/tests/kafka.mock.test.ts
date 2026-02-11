import { describe, test, expect, beforeEach } from 'bun:test';
import { MockKafkaConnectClient } from '../src/clients/kafka.mock';
import type { PipelineConfig } from '../src/clients/kafka.interface';

describe('MockKafkaConnectClient', () => {
  let client: MockKafkaConnectClient;

  beforeEach(() => {
    client = new MockKafkaConnectClient({ apiUrl: 'http://localhost:4195' });
    client.clearMockData();
  });

  test('should deploy a pipeline', async () => {
    const config: PipelineConfig = {
      name: 'waterfall-pipeline',
      yaml: 'input:\n  kafka: {}',
      enabled: true,
    };

    await client.deployPipeline(config);

    const status = await client.getPipelineStatus('waterfall-pipeline');
    expect(status.name).toBe('waterfall-pipeline');
    expect(status.status).toBe('running');
  });

  test('should list pipelines', async () => {
    const config1: PipelineConfig = {
      name: 'pipeline-1',
      yaml: 'input: {}',
      enabled: true,
    };
    const config2: PipelineConfig = {
      name: 'pipeline-2',
      yaml: 'input: {}',
      enabled: false,
    };

    await client.deployPipeline(config1);
    await client.deployPipeline(config2);

    const pipelines = await client.listPipelines();
    expect(pipelines.length).toBe(2);
    expect(pipelines.find((p) => p.name === 'pipeline-1')?.status).toBe('running');
    expect(pipelines.find((p) => p.name === 'pipeline-2')?.status).toBe('stopped');
  });

  test('should reload a pipeline', async () => {
    const config: PipelineConfig = {
      name: 'test-pipeline',
      yaml: 'input: {}',
      enabled: true,
    };

    await client.deployPipeline(config);
    await client.reloadPipeline('test-pipeline');

    const status = await client.getPipelineStatus('test-pipeline');
    expect(status.uptime).toBe(0);
    expect(status.messagesProcessed).toBe(0);
  });

  test('should stop and start a pipeline', async () => {
    const config: PipelineConfig = {
      name: 'test-pipeline',
      yaml: 'input: {}',
      enabled: true,
    };

    await client.deployPipeline(config);

    await client.stopPipeline('test-pipeline');
    let status = await client.getPipelineStatus('test-pipeline');
    expect(status.status).toBe('stopped');

    await client.startPipeline('test-pipeline');
    status = await client.getPipelineStatus('test-pipeline');
    expect(status.status).toBe('running');
  });

  test('should throw error for non-existent pipeline', async () => {
    expect(async () => {
      await client.getPipelineStatus('non-existent');
    }).toThrow();
  });

  test('should clear mock data', async () => {
    const config: PipelineConfig = {
      name: 'test-pipeline',
      yaml: 'input: {}',
      enabled: true,
    };

    await client.deployPipeline(config);
    client.clearMockData();

    const pipelines = await client.listPipelines();
    expect(pipelines.length).toBe(0);
  });
});
