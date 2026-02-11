import { Kafka, Admin, Producer, Consumer } from 'kafkajs';
import {
  IRedpandaBrokerClient,
  RedpandaBrokerConfig,
  TopicConfig,
  ProducerMessage,
  ConsumerMessage,
  TopicMetadata,
} from './redpanda-broker.interface';

/**
 * Real Redpanda broker client using KafkaJS
 * Connects to Redpanda broker using Kafka protocol with SASL authentication
 */
export class RealRedpandaBrokerClient implements IRedpandaBrokerClient {
  private kafka: Kafka;
  private admin: Admin;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();

  constructor(config: RedpandaBrokerConfig) {
    // Create Kafka instance with Redpanda configuration
    this.kafka = new Kafka({
      brokers: config.brokers,
      ssl: config.ssl ? {} : false,
      sasl: config.sasl
        ? {
            mechanism: config.sasl.mechanism,
            username: config.sasl.username,
            password: config.sasl.password,
          }
        : undefined,
      clientId: 'molen-redpanda-client',
    });

    this.admin = this.kafka.admin();
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    await this.admin.connect();
    await this.producer.connect();
  }

  async disconnect(): Promise<void> {
    // Disconnect all consumers
    for (const [_groupId, consumer] of this.consumers.entries()) {
      try {
        await consumer.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
    this.consumers.clear();

    await this.producer.disconnect();
    await this.admin.disconnect();
  }

  async createTopic(config: TopicConfig): Promise<boolean> {
    try {
      const result = await this.admin.createTopics({
        topics: [
          {
            topic: config.topic,
            numPartitions: config.numPartitions || 1,
            replicationFactor: config.replicationFactor || -1, // -1 means use broker default
          },
        ],
      });
      return result;
    } catch (error: unknown) {
      // If topic already exists, return false
      if (error instanceof Error && error.message.includes('already exists')) {
        return false;
      }
      throw error;
    }
  }

  async deleteTopic(topic: string): Promise<void> {
    await this.admin.deleteTopics({
      topics: [topic],
    });
  }

  async listTopics(): Promise<string[]> {
    return await this.admin.listTopics();
  }

  async getTopicMetadata(topic: string): Promise<TopicMetadata> {
    const metadata = await this.admin.fetchTopicMetadata({
      topics: [topic],
    });

    if (metadata.topics.length === 0) {
      throw new Error(`Topic ${topic} not found`);
    }

    const topicInfo = metadata.topics[0];
    return {
      name: topicInfo.name,
      partitions: topicInfo.partitions.length,
      replicationFactor: topicInfo.partitions[0]?.replicas?.length || 1,
    };
  }

  async produce(message: ProducerMessage): Promise<void> {
    await this.producer.send({
      topic: message.topic,
      messages: [
        {
          key: message.key,
          value: message.value,
          headers: message.headers,
        },
      ],
    });
  }

  async produceBatch(messages: ProducerMessage[]): Promise<void> {
    // Group messages by topic
    const messagesByTopic = new Map<string, Array<{ key?: string; value: string; headers?: Record<string, string> }>>();
    
    for (const msg of messages) {
      if (!messagesByTopic.has(msg.topic)) {
        messagesByTopic.set(msg.topic, []);
      }
      messagesByTopic.get(msg.topic)!.push({
        key: msg.key,
        value: msg.value,
        headers: msg.headers,
      });
    }

    // Send batches for each topic
    for (const [topic, msgs] of messagesByTopic.entries()) {
      await this.producer.send({
        topic,
        messages: msgs,
      });
    }
  }

  async consume(
    topic: string,
    groupId: string,
    fromBeginning: boolean = false,
    maxMessages: number = 10
  ): Promise<ConsumerMessage[]> {
    // Create or get consumer for this group
    let consumer = this.consumers.get(groupId);
    if (!consumer) {
      consumer = this.kafka.consumer({ groupId });
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning });
      this.consumers.set(groupId, consumer);
    }

    const messages: ConsumerMessage[] = [];

    // Set up message handler
    const messagePromise = new Promise<void>((resolve) => {
      consumer!.run({
        eachMessage: async ({ topic, partition, message }) => {
          messages.push({
            topic,
            partition,
            offset: message.offset,
            key: message.key ? message.key.toString() : null,
            value: message.value ? message.value.toString() : '',
            headers: message.headers
              ? Object.fromEntries(
                  Object.entries(message.headers).map(([k, v]) => [
                    k,
                    v ? v.toString() : '',
                  ])
                )
              : undefined,
            timestamp: message.timestamp,
          });

          if (messages.length >= maxMessages) {
            resolve();
          }
        },
      });

      // Timeout after 5 seconds if not enough messages
      setTimeout(() => resolve(), 5000);
    });

    await messagePromise;

    // Stop the consumer after reading messages
    await consumer.stop();

    return messages;
  }
}
