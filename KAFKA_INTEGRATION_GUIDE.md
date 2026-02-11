# Kafka Broker Integration Guide

## Overview

This guide covers the Kafka broker integration using the Kafka API (KafkaJS) for message streaming in the Molen fraud detection platform. Kafka serves as the high-performance message broker for real-time transaction event processing.

## Architecture

Kafka replaces LavinMQ as the message broker in Molen's V2.0 architecture:

```
Transaction Events → Kafka Broker → Kafka Connect → Fraud Detection Pipeline
                                    ↓
                           API (produce/consume)
```

## Components

### 1. IKafkaBrokerClient Interface

The main interface for Kafka API operations:

```typescript
interface IKafkaBrokerClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  createTopic(config: TopicConfig): Promise<boolean>;
  deleteTopic(topic: string): Promise<void>;
  listTopics(): Promise<string[]>;
  getTopicMetadata(topic: string): Promise<TopicMetadata>;
  produce(message: ProducerMessage): Promise<void>;
  produceBatch(messages: ProducerMessage[]): Promise<void>;
  consume(topic: string, groupId: string, fromBeginning?: boolean, maxMessages?: number): Promise<ConsumerMessage[]>;
}
```

### 2. RealKafkaBrokerClient

Production implementation using KafkaJS:
- **SASL Authentication**: SCRAM-SHA-256 or SCRAM-SHA-512
- **SSL/TLS**: Enabled by default for cloud deployments
- **Admin API**: Topic management operations
- **Producer**: Message publishing with batching support
- **Consumer**: Message consumption with consumer groups

### 3. MockKafkaBrokerClient

In-memory implementation for testing:
- No external dependencies
- Fast test execution
- Predictable behavior
- Test utility methods

## Configuration

### Environment Variables

```bash
# Kafka broker endpoints (comma-separated for multiple brokers)
KAFKA_BROKERS=broker1:9092,broker2:9092,broker3:9092

# SASL authentication credentials
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
KAFKA_SASL_MECHANISM=scram-sha-256  # or scram-sha-512

# Optional: Use mocks for testing
USE_MOCKS=false
```

### Kafka Cloud Example

```bash
KAFKA_BROKERS=d65uo0rt489913vpjspg.any.ap-southeast-1.mpx.prd.cloud.redpanda.com:9092
KAFKA_USERNAME=bongko
KAFKA_PASSWORD=P@ssw0rd
KAFKA_SASL_MECHANISM=scram-sha-256
```

## Usage Examples

### Basic Usage

```typescript
import { ExternalClientFactory } from '@molen/core';

// Create client (automatically uses env vars)
const broker = ExternalClientFactory.createKafkaBrokerClient();

// Connect to broker
await broker.connect();

// Create a topic
await broker.createTopic({
  topic: 'fraud-events',
  numPartitions: 3,
  replicationFactor: -1  // Use broker default
});

// Produce a message
await broker.produce({
  topic: 'fraud-events',
  key: 'transaction-123',
  value: JSON.stringify({
    userId: 'user-456',
    amount: 100.50,
    timestamp: Date.now()
  }),
  headers: {
    'event-type': 'transaction',
    'source': 'payment-api'
  }
});

// Consume messages
const messages = await broker.consume(
  'fraud-events',
  'fraud-processor-group',
  true,  // from beginning
  10     // max messages
);

console.log(`Received ${messages.length} messages`);
messages.forEach(msg => {
  console.log(`Key: ${msg.key}, Value: ${msg.value}`);
});

// Cleanup
await broker.disconnect();
```

### Batch Message Production

```typescript
// Prepare batch of messages
const batch = [
  {
    topic: 'fraud-events',
    key: 'txn-1',
    value: JSON.stringify({ userId: 'u1', amount: 50 })
  },
  {
    topic: 'fraud-events',
    key: 'txn-2',
    value: JSON.stringify({ userId: 'u2', amount: 75 })
  },
  {
    topic: 'fraud-events',
    key: 'txn-3',
    value: JSON.stringify({ userId: 'u3', amount: 100 })
  }
];

// Send batch (more efficient than individual sends)
await broker.produceBatch(batch);
```

### Topic Management

```typescript
// List all topics
const topics = await broker.listTopics();
console.log('Available topics:', topics);

// Get topic metadata
const metadata = await broker.getTopicMetadata('fraud-events');
console.log(`Topic: ${metadata.name}`);
console.log(`Partitions: ${metadata.partitions}`);
console.log(`Replication Factor: ${metadata.replicationFactor}`);

// Delete a topic (caution!)
await broker.deleteTopic('old-topic');
```

### Using with Mock for Testing

```typescript
import { MockKafkaBrokerClient } from '@molen/core';

// Create mock client
const mockBroker = new MockKafkaBrokerClient({
  brokers: ['localhost:9092']
});

await mockBroker.connect();

// Same interface as real client
await mockBroker.createTopic({ topic: 'test-topic' });
await mockBroker.produce({
  topic: 'test-topic',
  value: 'test message'
});

// Verify with test utilities
const mockTopics = mockBroker.getMockTopics();
const mockMessages = mockBroker.getMockMessages('test-topic');
console.log(`Topics: ${mockTopics.length}, Messages: ${mockMessages.length}`);
```

## Integration with Molen Fraud Detection

### Waterfall Processing Flow

```typescript
import { ExternalClientFactory } from '@molen/core';

// Initialize clients
const broker = ExternalClientFactory.createKafkaBrokerClient();
const redis = ExternalClientFactory.createRedisClient();
const elastic = ExternalClientFactory.createElasticClient();

await broker.connect();

// Consume transaction events
const transactions = await broker.consume(
  'raw-transactions',
  'fraud-waterfall-processor',
  false,  // from latest
  100     // batch size
);

// Process through waterfall layers
for (const msg of transactions) {
  const transaction = JSON.parse(msg.value);
  
  // Layer 1: Stateless rules
  const layer1Result = evaluateStatelessRules(transaction);
  
  if (layer1Result.block) {
    // Produce alert
    await broker.produce({
      topic: 'fraud-alerts',
      key: transaction.id,
      value: JSON.stringify({ ...transaction, layer: 1, blocked: true })
    });
    continue;
  }
  
  // Layer 2: Velocity checks (Redis)
  const velocityCount = await redis.incr(`velocity:${transaction.userId}`);
  if (velocityCount > 10) {
    await broker.produce({
      topic: 'fraud-alerts',
      key: transaction.id,
      value: JSON.stringify({ ...transaction, layer: 2, blocked: true })
    });
    continue;
  }
  
  // Layer 3: ML model inference
  const riskScore = await evaluateMLModel(transaction);
  
  // Log to Elasticsearch
  await elastic.index({
    index: 'fraud-evaluations',
    body: {
      ...transaction,
      riskScore,
      timestamp: Date.now()
    }
  });
  
  // Produce result
  await broker.produce({
    topic: 'fraud-results',
    key: transaction.id,
    value: JSON.stringify({ ...transaction, riskScore, passed: true })
  });
}

await broker.disconnect();
```

## Testing

### Unit Tests with Mock

```typescript
import { describe, test, expect } from 'bun:test';
import { MockKafkaBrokerClient } from '@molen/core';

describe('Fraud Event Processing', () => {
  test('should process transaction events', async () => {
    const broker = new MockKafkaBrokerClient({ brokers: ['localhost:9092'] });
    
    await broker.connect();
    await broker.createTopic({ topic: 'transactions' });
    
    // Produce test transaction
    await broker.produce({
      topic: 'transactions',
      key: 'test-txn',
      value: JSON.stringify({ amount: 100, userId: 'user-1' })
    });
    
    // Consume and verify
    const messages = await broker.consume('transactions', 'test-group', true, 1);
    expect(messages.length).toBe(1);
    expect(messages[0].key).toBe('test-txn');
  });
});
```

### Integration Tests

Integration tests run against a real Kafka broker:

```bash
# Set credentials
export KAFKA_BROKERS="your-broker:9092"
export KAFKA_USERNAME="your-username"
export KAFKA_PASSWORD="your-password"
export KAFKA_SASL_MECHANISM="scram-sha-256"

# Run integration tests
cd packages/core
bun test tests/integration/kafka-broker.integration.test.ts
```

Tests automatically:
- Create unique test topics
- Produce and consume messages
- Verify message integrity
- Clean up test data
- Skip if credentials not provided

## Performance Considerations

### Batch Production

Always prefer batch production for multiple messages:

```typescript
// ❌ Slow - individual sends
for (const msg of messages) {
  await broker.produce(msg);
}

// ✅ Fast - single batch
await broker.produceBatch(messages);
```

### Consumer Groups

Use consumer groups for parallel processing:

```typescript
// Multiple consumers in same group share partitions
const consumer1 = await broker.consume('events', 'fraud-group', false, 50);
const consumer2 = await broker.consume('events', 'fraud-group', false, 50);
// Each gets different partitions
```

### Connection Reuse

Reuse connections instead of creating new ones:

```typescript
// ❌ Slow - reconnecting each time
async function processMessage(msg) {
  const broker = ExternalClientFactory.createKafkaBrokerClient();
  await broker.connect();
  await broker.produce(msg);
  await broker.disconnect();
}

// ✅ Fast - reuse connection
const broker = ExternalClientFactory.createKafkaBrokerClient();
await broker.connect();

async function processMessage(msg) {
  await broker.produce(msg);
}

// Later...
await broker.disconnect();
```

## Security

### SASL Authentication

Kafka supports multiple SASL mechanisms:

- **SCRAM-SHA-256**: Recommended for most deployments
- **SCRAM-SHA-512**: Higher security, slightly slower
- **PLAIN**: Not recommended for production

### SSL/TLS

SSL is enabled by default for cloud deployments. For self-hosted Kafka:

```typescript
const broker = new RealKafkaBrokerClient({
  brokers: ['localhost:9092'],
  ssl: false,  // Disable for local development
  sasl: {
    mechanism: 'scram-sha-256',
    username: 'user',
    password: 'pass'
  }
});
```

### Credential Management

**Never commit credentials to the repository!**

✅ Use environment variables:
```bash
export KAFKA_PASSWORD="secret"
```

✅ Use GitHub Secrets for CI/CD

✅ Use secret management services (AWS Secrets Manager, etc.)

❌ Don't hardcode in source files

❌ Don't commit `.env` files

## Troubleshooting

### Connection Timeouts

```
Error: Connection timeout
```

**Solutions:**
- Verify broker URL is correct
- Check firewall rules
- Ensure broker is running
- Verify SSL/TLS settings match broker config

### Authentication Failures

```
Error: SASL authentication failed
```

**Solutions:**
- Double-check username and password
- Verify SASL mechanism matches broker config
- Check if account has necessary permissions

### Topic Creation Fails

```
Error: Topic already exists
```

**Solution:**
- Check if topic exists first: `const created = await broker.createTopic(...)`
- Returns `false` if topic already exists (not an error)

### Consumer Not Receiving Messages

**Solutions:**
- Verify topic has messages: `await broker.getTopicMetadata(topic)`
- Check consumer group offset: consumer may have already read messages
- Try `fromBeginning: true` to read all messages
- Ensure messages were produced to correct topic

## Best Practices

1. **Always disconnect**: Use try/finally to ensure cleanup
   ```typescript
   const broker = ExternalClientFactory.createKafkaBrokerClient();
   try {
     await broker.connect();
     // ... operations
   } finally {
     await broker.disconnect();
   }
   ```

2. **Use meaningful keys**: Message keys enable partition affinity
   ```typescript
   await broker.produce({
     topic: 'transactions',
     key: transaction.userId,  // Same user → same partition
     value: JSON.stringify(transaction)
   });
   ```

3. **Include headers**: Metadata helps with routing and monitoring
   ```typescript
   await broker.produce({
     topic: 'events',
     value: data,
     headers: {
       'event-type': 'transaction',
       'source': 'payment-api',
       'version': '2.0'
     }
   });
   ```

4. **Handle errors gracefully**: Network issues can occur
   ```typescript
   try {
     await broker.produce(message);
   } catch (error) {
     console.error('Failed to produce message:', error);
     // Implement retry logic or dead letter queue
   }
   ```

5. **Monitor performance**: Track message throughput
   ```typescript
   const startTime = Date.now();
   await broker.produceBatch(messages);
   const duration = Date.now() - startTime;
   console.log(`Produced ${messages.length} messages in ${duration}ms`);
   ```

## References

- [Kafka Documentation](https://docs.redpanda.com/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Molen Architecture Guide](./SELF_SERVICE_ARCHITECTURE.md)
- [Integration Tests Guide](../packages/core/tests/integration/README.md)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review integration test examples
3. Consult Kafka documentation
4. Open GitHub issue with details
