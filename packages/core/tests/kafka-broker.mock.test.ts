import { describe, test, expect, beforeEach } from 'bun:test';
import { MockKafkaBrokerClient } from '../src/clients/kafka-broker.mock';

describe('MockKafkaBrokerClient', () => {
  let client: MockKafkaBrokerClient;

  beforeEach(() => {
    client = new MockKafkaBrokerClient({
      brokers: ['localhost:9092'],
    });
  });

  test('should connect and disconnect', async () => {
    expect(client.isConnected()).toBe(false);
    
    await client.connect();
    expect(client.isConnected()).toBe(true);
    
    await client.disconnect();
    expect(client.isConnected()).toBe(false);
  });

  test('should create and list topics', async () => {
    await client.connect();

    // Create a topic
    const created = await client.createTopic({
      topic: 'test-topic',
      numPartitions: 3,
      replicationFactor: 2,
    });

    expect(created).toBe(true);

    // List topics
    const topics = await client.listTopics();
    expect(topics).toContain('test-topic');
    expect(topics.length).toBe(1);

    // Try to create duplicate
    const duplicateCreated = await client.createTopic({
      topic: 'test-topic',
      numPartitions: 1,
    });
    expect(duplicateCreated).toBe(false);
  });

  test('should get topic metadata', async () => {
    await client.connect();
    await client.createTopic({
      topic: 'test-topic',
      numPartitions: 5,
      replicationFactor: 3,
    });

    const metadata = await client.getTopicMetadata('test-topic');
    expect(metadata.name).toBe('test-topic');
    expect(metadata.partitions).toBe(5);
    expect(metadata.replicationFactor).toBe(3);
  });

  test('should throw error for non-existent topic metadata', async () => {
    await client.connect();

    expect(async () => {
      await client.getTopicMetadata('non-existent');
    }).toThrow('Topic non-existent not found');
  });

  test('should produce and consume messages', async () => {
    await client.connect();
    await client.createTopic({ topic: 'message-topic' });

    // Produce a message
    await client.produce({
      topic: 'message-topic',
      key: 'key1',
      value: JSON.stringify({ data: 'test' }),
      headers: { 'content-type': 'application/json' },
    });

    // Consume messages
    const messages = await client.consume('message-topic', 'test-group', true, 10);

    expect(messages.length).toBe(1);
    expect(messages[0].topic).toBe('message-topic');
    expect(messages[0].key).toBe('key1');
    expect(messages[0].value).toContain('test');
    expect(messages[0].headers?.['content-type']).toBe('application/json');
  });

  test('should produce batch messages', async () => {
    await client.connect();
    await client.createTopic({ topic: 'batch-topic' });

    const messages = [
      {
        topic: 'batch-topic',
        key: 'batch1',
        value: 'message 1',
      },
      {
        topic: 'batch-topic',
        key: 'batch2',
        value: 'message 2',
      },
      {
        topic: 'batch-topic',
        key: 'batch3',
        value: 'message 3',
      },
    ];

    await client.produceBatch(messages);

    const consumed = await client.consume('batch-topic', 'batch-group', true, 10);
    expect(consumed.length).toBe(3);
    expect(consumed[0].key).toBe('batch1');
    expect(consumed[1].key).toBe('batch2');
    expect(consumed[2].key).toBe('batch3');
  });

  test('should delete topics', async () => {
    await client.connect();
    await client.createTopic({ topic: 'delete-test' });

    let topics = await client.listTopics();
    expect(topics).toContain('delete-test');

    await client.deleteTopic('delete-test');

    topics = await client.listTopics();
    expect(topics).not.toContain('delete-test');
  });

  test('should support multiple topics', async () => {
    await client.connect();
    
    await client.createTopic({ topic: 'topic1' });
    await client.createTopic({ topic: 'topic2' });
    await client.createTopic({ topic: 'topic3' });

    const topics = await client.listTopics();
    expect(topics.length).toBe(3);
    expect(topics).toContain('topic1');
    expect(topics).toContain('topic2');
    expect(topics).toContain('topic3');
  });

  test('should clear mock data', async () => {
    await client.connect();
    await client.createTopic({ topic: 'test' });
    await client.produce({ topic: 'test', value: 'data' });

    expect(client.getMockTopics()).toContain('test');
    expect(client.getMockMessages('test').length).toBe(1);

    client.clearMockData();

    expect(client.getMockTopics().length).toBe(0);
    expect(client.getMockMessages('test').length).toBe(0);
  });

  test('should track message offsets', async () => {
    await client.connect();
    await client.createTopic({ topic: 'offset-topic' });

    await client.produce({ topic: 'offset-topic', value: 'msg1' });
    await client.produce({ topic: 'offset-topic', value: 'msg2' });
    await client.produce({ topic: 'offset-topic', value: 'msg3' });

    const messages = await client.consume('offset-topic', 'offset-group', true, 10);

    expect(messages[0].offset).toBe('0');
    expect(messages[1].offset).toBe('1');
    expect(messages[2].offset).toBe('2');
  });

  test('should respect maxMessages limit in consume', async () => {
    await client.connect();
    await client.createTopic({ topic: 'limit-topic' });

    // Produce 10 messages
    for (let i = 0; i < 10; i++) {
      await client.produce({
        topic: 'limit-topic',
        value: `message ${i}`,
      });
    }

    // Consume only 5
    const messages = await client.consume('limit-topic', 'limit-group', true, 5);

    expect(messages.length).toBe(5);
  });
});
