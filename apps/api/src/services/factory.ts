import { IMolenRepository, IEventStream } from './interfaces';
import { PostgresRepository } from './PostgresRepository';
import { KafkaEventStream } from './KafkaEventStream';

class ServiceFactory {
  private repository: IMolenRepository | null = null;
  private eventStream: IEventStream | null = null;

  getRepository(): IMolenRepository {
    if (!this.repository) {
      this.repository = new PostgresRepository(process.env.DATABASE_URL!);
    }
    return this.repository;
  }

  setRepository(repo: IMolenRepository) {
    this.repository = repo;
  }

  async getEventStream(): Promise<IEventStream> {
    if (!this.eventStream) {
      const brokers = (process.env.KAFKA_BROKERS || 'localhost:19092').split(',');
      const kafka = new KafkaEventStream(brokers);
      await kafka.connect();
      this.eventStream = kafka;
    }
    return this.eventStream;
  }

  setEventStream(stream: IEventStream) {
    this.eventStream = stream;
  }
}

export const services = new ServiceFactory();
