# Kafka Integration Quick Setup

## Quick Start with Provided Credentials

### 1. Local Development Setup

Create a `.env` file in the repository root (this file is gitignored):

```bash
# Kafka Broker Configuration
KAFKA_BROKERS=d65uo0rt489913vpjspg.any.ap-southeast-1.mpx.prd.cloud.redpanda.com:9092
KAFKA_USERNAME=bongko
KAFKA_PASSWORD=P@ssw0rd
KAFKA_SASL_MECHANISM=scram-sha-256

# Use real client (not mocks)
USE_MOCKS=false
```

Or export environment variables:

```bash
export KAFKA_BROKERS="d65uo0rt489913vpjspg.any.ap-southeast-1.mpx.prd.cloud.redpanda.com:9092"
export KAFKA_USERNAME="bongko"
export KAFKA_PASSWORD="P@ssw0rd"
export KAFKA_SASL_MECHANISM="scram-sha-256"
export USE_MOCKS="false"
```

### 2. Install Dependencies

```bash
cd packages/core
bun install  # or npm install
```

### 3. Run Integration Tests

```bash
# From packages/core directory
bun test tests/integration/kafka-broker.integration.test.ts
```

Expected output:
```
✓ RealKafkaBrokerClient Integration
  ✓ should connect to Kafka broker
  ✓ should create a new topic
  ✓ should get topic metadata
  ✓ should produce and consume messages
  ✓ should produce batch messages
  ✓ should list all topics including test topic
  ✓ should not create duplicate topic

7 tests passed
```

### 4. Quick Test Script

Create a file `test-redpanda.ts`:

```typescript
import { ExternalClientFactory } from './packages/core/src/index';

async function testKafka() {
  console.log('🔌 Connecting to Kafka...');
  const broker = ExternalClientFactory.createKafkaBrokerClient();
  
  try {
    await broker.connect();
    console.log('✅ Connected successfully!');
    
    // List topics
    const topics = await broker.listTopics();
    console.log(`📋 Found ${topics.length} topics:`, topics.slice(0, 5));
    
    // Create test topic
    const testTopic = `test-${Date.now()}`;
    console.log(`\n📝 Creating topic: ${testTopic}`);
    const created = await broker.createTopic({
      topic: testTopic,
      numPartitions: 1,
      replicationFactor: -1
    });
    console.log(created ? '✅ Topic created' : '⚠️  Topic already exists');
    
    // Produce message
    console.log('\n📤 Producing message...');
    await broker.produce({
      topic: testTopic,
      key: 'test-key',
      value: JSON.stringify({
        message: 'Hello from Molen!',
        timestamp: new Date().toISOString()
      }),
      headers: {
        'content-type': 'application/json'
      }
    });
    console.log('✅ Message produced');
    
    // Wait a bit for message to be committed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Consume message
    console.log('\n📥 Consuming messages...');
    const messages = await broker.consume(testTopic, 'test-group', true, 10);
    console.log(`✅ Consumed ${messages.length} messages`);
    
    if (messages.length > 0) {
      console.log('\n📨 First message:');
      console.log('  Key:', messages[0].key);
      console.log('  Value:', messages[0].value);
      console.log('  Headers:', messages[0].headers);
    }
    
    // Cleanup
    console.log(`\n🧹 Cleaning up test topic: ${testTopic}`);
    await broker.deleteTopic(testTopic);
    console.log('✅ Topic deleted');
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await broker.disconnect();
    console.log('👋 Disconnected');
  }
}

testKafka();
```

Run with:
```bash
bun run test-redpanda.ts
```

### 5. GitHub Secrets Setup

For CI/CD, add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Value |
|-------------|-------|
| `KAFKA_BROKERS` | `d65uo0rt489913vpjspg.any.ap-southeast-1.mpx.prd.cloud.redpanda.com:9092` |
| `KAFKA_USERNAME` | `bongko` |
| `KAFKA_PASSWORD` | `P@ssw0rd` |
| `KAFKA_SASL_MECHANISM` | `scram-sha-256` |

### 6. Manual Testing with Curl (Example)

The KafkaJS example provided translates to:

```javascript
const {Kafka} = require("kafkajs");

const redpanda = new Kafka({
  brokers: ["d65uo0rt489913vpjspg.any.ap-southeast-1.mpx.prd.cloud.redpanda.com:9092"],
  ssl: {},
  sasl: {
    mechanism: "scram-sha-256",
    username: "bongko",
    password: "P@ssw0rd"
  }
});

const admin = redpanda.admin();

admin.connect().then(() => {
  admin.createTopics({
    topics: [{
      topic: "demo-topic",
      numPartitions: 1,
      replicationFactor: -1
    }]
  })
  .then((resp) => {
    resp ? console.log("Created topic") : console.log("Failed to create topic")
  })
  .finally(() => admin.disconnect())
});
```

Our implementation wraps this in a cleaner interface that works with the Molen factory pattern.

## Verification Checklist

- [ ] Environment variables are set
- [ ] Dependencies are installed (`bun install`)
- [ ] Integration tests pass
- [ ] Can connect to broker
- [ ] Can create topics
- [ ] Can produce messages
- [ ] Can consume messages
- [ ] GitHub secrets configured (for CI/CD)

## Common Issues

### Issue: "Cannot find module 'kafkajs'"
**Solution:** Run `bun install` or `npm install` in `packages/core/`

### Issue: "SASL authentication failed"
**Solution:** Double-check username and password in environment variables

### Issue: "Connection timeout"
**Solution:** Verify broker URL and network connectivity

### Issue: "Topic already exists" warning
**Solution:** This is expected behavior - topic creation returns `false` if topic exists

## Next Steps

1. ✅ Integration tests passing
2. ✅ Can produce/consume messages
3. 🔄 Integrate with Kafka Connect for waterfall processing
4. 🔄 Connect to fraud detection pipeline
5. 🔄 Add monitoring and metrics

## Resources

- [Full Integration Guide](./KAFKA_INTEGRATION_GUIDE.md)
- [Integration Tests](./packages/core/tests/integration/kafka-broker.integration.test.ts)
- [Architecture Documentation](./SELF_SERVICE_ARCHITECTURE.md)

## Support

Questions? Check:
1. [Integration Guide](./KAFKA_INTEGRATION_GUIDE.md) - Comprehensive documentation
2. [Troubleshooting](./KAFKA_INTEGRATION_GUIDE.md#troubleshooting) - Common issues
3. [GitHub Issues](https://github.com/sayyidyofa/molen/issues) - Report problems
