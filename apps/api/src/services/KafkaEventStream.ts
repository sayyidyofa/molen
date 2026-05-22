import { IEventStream } from './interfaces';
import { OrchestratorGraph } from '@molen/shared-types';
import { Kafka, Producer } from 'kafkajs';

export class KafkaEventStream implements IEventStream {
  private producer: Producer;

  constructor(brokers: string[]) {
    const kafka = new Kafka({
      clientId: 'molen-api',
      brokers
    });
    this.producer = kafka.producer();
  }

  async connect() {
    await this.producer.connect();
  }

  async publishDeployment(topic: string, graph: OrchestratorGraph): Promise<void> {
    await this.producer.send({
      topic,
      messages: [
        { value: JSON.stringify(graph) }
      ]
    });
  }
}
