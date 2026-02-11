/**
 * Redpanda Broker client interface
 * Direct Kafka API access to Redpanda broker for message streaming
 */

export interface RedpandaBrokerConfig {
  brokers: string[];
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

export interface TopicConfig {
  topic: string;
  numPartitions?: number;
  replicationFactor?: number;
}

export interface ProducerMessage {
  topic: string;
  key?: string;
  value: string;
  headers?: Record<string, string>;
}

export interface ConsumerMessage {
  topic: string;
  partition: number;
  offset: string;
  key: string | null;
  value: string;
  headers?: Record<string, string>;
  timestamp: string;
}

export interface TopicMetadata {
  name: string;
  partitions: number;
  replicationFactor: number;
}

/**
 * IRedpandaBrokerClient - Interface for Redpanda broker operations
 * Uses Kafka protocol for message streaming
 */
export interface IRedpandaBrokerClient {
  /**
   * Connect to the broker
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the broker
   */
  disconnect(): Promise<void>;

  /**
   * Create a new topic
   */
  createTopic(config: TopicConfig): Promise<boolean>;

  /**
   * Delete a topic
   */
  deleteTopic(topic: string): Promise<void>;

  /**
   * List all topics
   */
  listTopics(): Promise<string[]>;

  /**
   * Get topic metadata
   */
  getTopicMetadata(topic: string): Promise<TopicMetadata>;

  /**
   * Produce a message to a topic
   */
  produce(message: ProducerMessage): Promise<void>;

  /**
   * Produce multiple messages in batch
   */
  produceBatch(messages: ProducerMessage[]): Promise<void>;

  /**
   * Consume messages from a topic
   * @param topic - Topic to consume from
   * @param groupId - Consumer group ID
   * @param fromBeginning - Start from beginning of topic
   * @param maxMessages - Maximum messages to consume (default: 10)
   */
  consume(
    topic: string,
    groupId: string,
    fromBeginning?: boolean,
    maxMessages?: number
  ): Promise<ConsumerMessage[]>;
}
