import { Kafka, Partitioners } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'molen-api',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:19092'],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

export const connectProducer = async () => {
  await producer.connect();
};

export const publishDeployment = async (topic: string, payload: unknown) => {
  await producer.send({
    topic,
    messages: [
      { value: JSON.stringify(payload) },
    ],
  });
};
