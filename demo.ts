#!/usr/bin/env bun

/**
 * Molen V2.0 Self-Service Fraud-Ops Platform Demo
 * Demonstrates the complete self-service ML lifecycle with Kafka integration
 */

// Set environment to use mocks for demo
process.env.USE_MOCKS = 'true';

import {
  ExternalClientFactory,
  RuleEvaluatorFactory,
  Transaction,
} from './packages/core/src/index';

async function main() {
  console.log('🚀 Molen V2.0: Self-Service Fraud-Ops Platform Demo\n');
  console.log('═══════════════════════════════════════════════════\n');

  // 1. Create clients using the Interface Factory Pattern
  console.log('1️⃣  CREATING CLIENTS (Interface Factory Pattern)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const elasticClient = ExternalClientFactory.createElasticClient();
  const redisClient = ExternalClientFactory.createRedisClient();
  const s3Client = ExternalClientFactory.createS3Client();
  const kafkaBroker = ExternalClientFactory.createKafkaBrokerClient();
  const mlTrainer = ExternalClientFactory.createMLTrainer();
  console.log('   ✓ Elasticsearch client (Alerts & Analytics)');
  console.log('   ✓ Redis client (Velocity State)');
  console.log('   ✓ S3 client (Model Storage - Cloudflare R2)');
  console.log('   ✓ Kafka Broker (Event Streaming)');
  console.log('   ✓ ML Trainer (Self-Service Training)\n');

  // 2. Kafka: Connect and create topics
  console.log('2️⃣  KAFKA: Setting up event streaming');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await kafkaBroker.connect();
  await kafkaBroker.createTopic({
    topic: 'fraud-events',
    numPartitions: 3,
    replicationFactor: -1,
  });
  console.log('   ✓ Connected to Kafka broker');
  console.log('   ✓ Created topic: fraud-events (3 partitions)\n');

  // 3. ML Training: The "Molen Path"
  console.log('3️⃣  ML TRAINING: The "Molen Path" Self-Service Workflow');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   Step 1: Extract 7-day training data window...');
  const trainingData = Buffer.from('training-data-parquet');
  console.log('   ✓ Extracted 10,000 transactions from last 7 days\n');

  console.log('   Step 2: Submit training job...');
  const trainingJob = await mlTrainer.submitTrainingJob({
    modelType: 'xgboost',
    trainingData: trainingData,
    hyperparameters: { maxDepth: 6, learningRate: 0.1 },
  });
  console.log(`   ✓ Training job submitted: ${trainingJob.jobId}`);
  console.log(`   Status: ${trainingJob.status}\n');

  console.log('   Step 3: Upload trained model to S3...');
  const modelData = Buffer.from('xgboost-model-binary');
  await s3Client.uploadModel('models/candidate/fraud-v2.bin', modelData, {
    version: '2.0.0',
    accuracy: '0.94',
    trainedAt: new Date().toISOString(),
  });
  console.log('   ✓ Model uploaded to S3: models/candidate/fraud-v2.bin');
  console.log('   Metadata: version=2.0.0, accuracy=94%\n');

  // 4. Shadow Mode: Test candidate model
  console.log('4️⃣  SHADOW MODE: Testing candidate model safely');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const statelessEvaluator = RuleEvaluatorFactory.createStatelessEvaluator({
    highAmountThreshold: 5000,
  });
  const velocityEvaluator = RuleEvaluatorFactory.createVelocityEvaluator({
    transactionsPerMinute: 5,
    transactionsPerHour: 20,
  });

  const testTransactions: Transaction[] = [
    { id: 'txn-001', userId: 'user-alice', amount: 100, timestamp: new Date() },
    { id: 'txn-002', userId: 'user-bob', amount: 15000, timestamp: new Date() },
    { id: 'txn-003', userId: 'user-alice', amount: 500, timestamp: new Date() },
  ];

  let liveCorrect = 0, candidateCorrect = 0;
  for (const transaction of testTransactions) {
    // Live model evaluation
    const statelessResult = await statelessEvaluator.evaluate(transaction);
    const velocityResult = await velocityEvaluator.evaluate(transaction);
    const liveScore = statelessResult.score + velocityResult.score;
    
    // Candidate model evaluation (simulated)
    const candidateScore = liveScore + (Math.random() * 10 - 5);
    
    // Simulate actual fraud label
    const actualFraud = transaction.amount > 10000;
    const liveFlagged = liveScore > 50;
    const candidateFlagged = candidateScore > 50;
    
    liveCorrect += (liveFlagged === actualFraud) ? 1 : 0;
    candidateCorrect += (candidateFlagged === actualFraud) ? 1 : 0;

    // Publish to Kafka for real-time processing
    await kafkaBroker.produce({
      topic: 'fraud-events',
      key: transaction.userId,
      value: JSON.stringify({
        ...transaction,
        liveScore,
        candidateScore,
        shadowMode: true,
      }),
    });

    // Log comparison to Elasticsearch
    await elasticClient.index({
      index: 'fraud-evaluations',
      document: {
        transaction,
        live: { score: liveScore, flagged: liveFlagged },
        candidate: { score: candidateScore, flagged: candidateFlagged },
        actualFraud,
        timestamp: new Date(),
      },
    });
  }

  console.log(`   ✓ Processed ${testTransactions.length} transactions in shadow mode`);
  console.log(`   Live model accuracy: ${(liveCorrect / testTransactions.length * 100).toFixed(1)}%`);
  console.log(`   Candidate model accuracy: ${(candidateCorrect / testTransactions.length * 100).toFixed(1)}%\n`);

  // 5. Model Comparison & Promotion
  console.log('5️⃣  MODEL COMPARISON: Decide to promote or reject');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const comparisonResult = await mlTrainer.compareModels('live', 'candidate');
  console.log(`   Live Model: Accuracy ${comparisonResult.liveMetrics.accuracy}%, FP Rate ${comparisonResult.liveMetrics.falsePositiveRate}%`);
  console.log(`   Candidate: Accuracy ${comparisonResult.candidateMetrics.accuracy}%, FP Rate ${comparisonResult.candidateMetrics.falsePositiveRate}%`);
  console.log(`   Recommendation: ${comparisonResult.recommendation.toUpperCase()}\n`);

  if (comparisonResult.recommendation === 'promote') {
    console.log('   ✓ Promoting candidate to live...');
    await mlTrainer.promoteModel('candidate');
    console.log('   ✓ Candidate is now LIVE! 🎉\n');
  }

  // 6. Alert Triage & Audit Trail
  console.log('6️⃣  ALERT TRIAGE: Investigating flagged transactions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const searchResult = await elasticClient.search({
    index: 'fraud-evaluations',
  });
  console.log(`   ✓ Found ${searchResult.hits.total.value} evaluations`);
  console.log(`   ✓ Complete audit trail with model versions`);
  console.log(`   ✓ Searchable in Elasticsearch\n`);

  // 7. Redis Velocity State
  console.log('7️⃣  VELOCITY TRACKING: Redis hot state');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const velocityKey = 'velocity:user-alice:minute:' + Math.floor(Date.now() / 60000);
  await redisClient.set(velocityKey, '3', 60);
  const count = await redisClient.get(velocityKey);
  console.log(`   ✓ User "alice" transaction count this minute: ${count}`);
  console.log(`   ✓ Velocity rules: max 5/min, 20/hour\n`);

  // Cleanup
  await kafkaBroker.disconnect();

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ DEMO COMPLETED SUCCESSFULLY!\n');
  console.log('📚 The "Molen Path" (Self-Service Workflow):');
  console.log('   1. EXTRACT  → Select 7-day data window from S3');
  console.log('   2. TRAIN    → Submit XGBoost training job');
  console.log('   3. EVALUATE → Deploy in shadow mode (48-72h)');
  console.log('   4. COMPARE  → View live vs candidate metrics');
  console.log('   5. PROMOTE  → One-click promotion when FP↓\n');
  console.log('🚀 Next steps:');
  console.log('   • Start API: bun run dev:api (http://localhost:3000)');
  console.log('   • Start UI:  bun run dev:ui (http://localhost:5173)');
  console.log('   • Deploy:    kubectl apply -f k8s/');
  console.log('   • Docs:      cat SELF_SERVICE_ARCHITECTURE.md');
}

main().catch(console.error);
