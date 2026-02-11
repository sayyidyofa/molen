import {
  IRedpandaBrokerClient,
  RedpandaBrokerConfig,
  TopicConfig,
  ProducerMessage,
  ConsumerMessage,
  TopicMetadata,
} from './redpanda-broker.interface';

/**
 * Mock implementation of Redpanda broker client for testing
 */
export class MockRedpandaBrokerClient implements IRedpandaBrokerClient {
  private topics: Map<string, TopicConfig> = new Map();
  private messages: Map<string, ConsumerMessage[]> = new Map();
  private connected: boolean = false;

  constructor(_config: RedpandaBrokerConfig) {
    // Mock constructor - no actual connection
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async createTopic(config: TopicConfig): Promise<boolean> {
    if (this.topics.has(config.topic)) {
      return false; // Topic already exists
    }
    this.topics.set(config.topic, config);
    this.messages.set(config.topic, []);
    return true;
  }

  async deleteTopic(topic: string): Promise<void> {
    this.topics.delete(topic);
    this.messages.delete(topic);
  }

  async listTopics(): Promise<string[]> {
    return Array.from(this.topics.keys());
  }

  async getTopicMetadata(topic: string): Promise<TopicMetadata> {
    const config = this.topics.get(topic);
    if (!config) {
      throw new Error(`Topic ${topic} not found`);
    }
    return {
      name: topic,
      partitions: config.numPartitions || 1,
      replicationFactor: config.replicationFactor || 1,
    };
  }

  async produce(message: ProducerMessage): Promise<void> {
    const topicMessages = this.messages.get(message.topic) || [];
    topicMessages.push({
      topic: message.topic,
      partition: 0,
      offset: String(topicMessages.length),
      key: message.key || null,
      value: message.value,
      headers: message.headers,
      timestamp: new Date().toISOString(),
    });
    this.messages.set(message.topic, topicMessages);
  }

  async produceBatch(messages: ProducerMessage[]): Promise<void> {
    for (const message of messages) {
      await this.produce(message);
    }
  }

  async consume(
    topic: string,
    _groupId: string,
    _fromBeginning?: boolean,
    maxMessages: number = 10
  ): Promise<ConsumerMessage[]> {
    const topicMessages = this.messages.get(topic) || [];
    return topicMessages.slice(0, maxMessages);
  }

  // Test utility methods
  clearMockData(): void {
    this.topics.clear();
    this.messages.clear();
  }

  getMockTopics(): string[] {
    return Array.from(this.topics.keys());
  }

  getMockMessages(topic: string): ConsumerMessage[] {
    return this.messages.get(topic) || [];
  }

  isConnected(): boolean {
    return this.connected;
  }
}
