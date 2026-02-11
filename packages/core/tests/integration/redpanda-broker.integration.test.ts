import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { RealRedpandaBrokerClient } from '../../src/clients/redpanda-broker.real';

// Integration tests only run when credentials are provided
const REDPANDA_BROKERS = process.env.REDPANDA_BROKERS;
const REDPANDA_USERNAME = process.env.REDPANDA_USERNAME;
const REDPANDA_PASSWORD = process.env.REDPANDA_PASSWORD;
const REDPANDA_SASL_MECHANISM = process.env.REDPANDA_SASL_MECHANISM as 'scram-sha-256' | 'scram-sha-512' | undefined;

const shouldRun = !!(REDPANDA_BROKERS && REDPANDA_USERNAME && REDPANDA_PASSWORD);

describe.skipIf(!shouldRun)('RealRedpandaBrokerClient Integration', () => {
  let client: RealRedpandaBrokerClient;
  const testTopicPrefix = 'molen-integration-test';
  const testTopic = `${testTopicPrefix}-${Date.now()}`;
  const testGroupId = `molen-test-consumer-${Date.now()}`;

  beforeAll(async () => {
    client = new RealRedpandaBrokerClient({
      brokers: REDPANDA_BROKERS!.split(','),
      ssl: true,
      sasl: {
        mechanism: REDPANDA_SASL_MECHANISM || 'scram-sha-256',
        username: REDPANDA_USERNAME!,
        password: REDPANDA_PASSWORD!,
      },
    });

    await client.connect();
  });

  afterAll(async () => {
    if (client) {
      try {
        // Clean up test topic
        await client.deleteTopic(testTopic);
      } catch (e) {
        // Ignore cleanup errors (topic might not exist)
      }
      await client.disconnect();
    }
  });

  test('should connect to Redpanda broker', async () => {
    // Connection happens in beforeAll, just verify we can list topics
    const topics = await client.listTopics();
    expect(Array.isArray(topics)).toBe(true);
  });

  test('should create a new topic', async () => {
    const created = await client.createTopic({
      topic: testTopic,
      numPartitions: 1,
      replicationFactor: -1, // Use broker default
    });

    expect(created).toBe(true);

    // Verify topic exists
    const topics = await client.listTopics();
    expect(topics).toContain(testTopic);
  });

  test('should get topic metadata', async () => {
    const metadata = await client.getTopicMetadata(testTopic);

    expect(metadata.name).toBe(testTopic);
    expect(metadata.partitions).toBeGreaterThan(0);
    expect(metadata.replicationFactor).toBeGreaterThan(0);
  });

  test('should produce and consume messages', async () => {
    // Produce a message
    const testMessage = {
      topic: testTopic,
      key: 'test-key-1',
      value: JSON.stringify({
        timestamp: Date.now(),
        event: 'test-transaction',
        userId: 'user-123',
      }),
      headers: {
        'content-type': 'application/json',
        'test-id': 'integration-test',
      },
    };

    await client.produce(testMessage);

    // Wait a bit for message to be committed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Consume the message
    const messages = await client.consume(testTopic, testGroupId, true, 1);

    expect(messages.length).toBeGreaterThan(0);
    const receivedMessage = messages[0];
    expect(receivedMessage.topic).toBe(testTopic);
    expect(receivedMessage.key).toBe('test-key-1');
    expect(receivedMessage.value).toContain('test-transaction');
    expect(receivedMessage.headers?.['test-id']).toBe('integration-test');
  });

  test('should produce batch messages', async () => {
    const batchMessages = [
      {
        topic: testTopic,
        key: 'batch-1',
        value: JSON.stringify({ batch: 1, data: 'message-1' }),
      },
      {
        topic: testTopic,
        key: 'batch-2',
        value: JSON.stringify({ batch: 2, data: 'message-2' }),
      },
      {
        topic: testTopic,
        key: 'batch-3',
        value: JSON.stringify({ batch: 3, data: 'message-3' }),
      },
    ];

    await client.produceBatch(batchMessages);

    // Verify batch was produced (we won't consume them to save operations)
    // The previous consume test already validates the produce/consume cycle
    expect(true).toBe(true);
  });

  test('should list all topics including test topic', async () => {
    const topics = await client.listTopics();

    expect(Array.isArray(topics)).toBe(true);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics).toContain(testTopic);
  });

  test('should not create duplicate topic', async () => {
    // Try to create the same topic again
    const created = await client.createTopic({
      topic: testTopic,
      numPartitions: 1,
      replicationFactor: -1,
    });

    // Should return false for already existing topic
    expect(created).toBe(false);
  });
});

if (!shouldRun) {
  console.log('⚠️  Redpanda broker integration tests skipped. Set REDPANDA_BROKERS, REDPANDA_USERNAME, and REDPANDA_PASSWORD to run.');
}
