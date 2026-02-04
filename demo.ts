#!/usr/bin/env bun

/**
 * Demo script showing how to use the Fraud-Ops Control Plane
 * This demonstrates the Interface Factory Pattern and core functionality
 */

// Set environment to use mocks for demo
process.env.USE_MOCKS = 'true';

import {
  ExternalClientFactory,
  RuleEvaluatorFactory,
  Transaction,
  type IRuleEvaluator,
  type IElasticClient,
} from './packages/core/src/index';

async function main() {
  console.log('🚀 Fraud-Ops Control Plane Demo\n');

  // 1. Create clients using the factory pattern
  console.log('1. Creating clients using ExternalClientFactory...');
  const elasticClient = ExternalClientFactory.createElasticClient();
  const redisClient = ExternalClientFactory.createRedisClient();
  console.log('   ✓ Elasticsearch client created (Mock)');
  console.log('   ✓ Redis client created (Mock)\n');

  // 2. Create rule evaluators
  console.log('2. Creating rule evaluators...');
  const statelessEvaluator = RuleEvaluatorFactory.createStatelessEvaluator({
    highAmountThreshold: 5000,
  });
  const velocityEvaluator = RuleEvaluatorFactory.createVelocityEvaluator({
    transactionsPerMinute: 5,
    transactionsPerHour: 20,
  });
  console.log('   ✓ Stateless evaluator created');
  console.log('   ✓ Velocity evaluator created\n');

  // 3. Process some test transactions
  console.log('3. Processing test transactions...\n');

  const testTransactions: Transaction[] = [
    {
      id: 'txn-001',
      userId: 'user-alice',
      amount: 100,
      timestamp: new Date(),
    },
    {
      id: 'txn-002',
      userId: 'user-bob',
      amount: 15000, // High amount - will trigger flag
      timestamp: new Date(),
    },
    {
      id: 'txn-003',
      userId: 'user-alice',
      amount: 500,
      timestamp: new Date(),
    },
    {
      id: 'txn-004',
      userId: 'user-alice',
      amount: 300,
      timestamp: new Date(),
    },
    {
      id: 'txn-005',
      userId: 'user-alice',
      amount: 200,
      timestamp: new Date(),
    },
  ];

  for (const transaction of testTransactions) {
    console.log(`   Processing ${transaction.id}...`);
    console.log(`   User: ${transaction.userId}, Amount: $${transaction.amount}`);

    // Run stateless evaluation
    const statelessResult = await statelessEvaluator.evaluate(transaction);
    console.log(`   Stateless Score: ${statelessResult.score}, Flags: ${statelessResult.flags.join(', ') || 'None'}`);

    // Run velocity evaluation
    const velocityResult = await velocityEvaluator.evaluate(transaction);
    console.log(`   Velocity Score: ${velocityResult.score}, Flags: ${velocityResult.flags.join(', ') || 'None'}`);

    const totalScore = statelessResult.score + velocityResult.score;
    const flagged = totalScore > 50;
    
    console.log(`   Total Score: ${totalScore}, Flagged: ${flagged ? 'YES ⚠️' : 'NO ✓'}`);

    // Log to Elasticsearch
    await elasticClient.index({
      index: 'fraud-alerts',
      document: {
        transaction,
        statelessResult,
        velocityResult,
        totalScore,
        flagged,
      },
    });
    console.log('   ✓ Logged to Elasticsearch\n');
  }

  // 4. Query flagged transactions
  console.log('4. Querying flagged transactions from Elasticsearch...');
  const searchResult = await elasticClient.search({
    index: 'fraud-alerts',
  });

  console.log(`   Found ${searchResult.hits.total.value} total alerts`);
  const flaggedCount = searchResult.hits.hits.filter(
    (hit: any) => hit._source.flagged
  ).length;
  console.log(`   ${flaggedCount} transactions flagged for review\n`);

  // 5. Demonstrate Redis velocity tracking
  console.log('5. Demonstrating Redis velocity tracking...');
  const velocityKey = 'velocity:user-alice:minute:' + Math.floor(Date.now() / 60000);
  const count = await redisClient.get(velocityKey);
  console.log(`   Transaction count for user-alice this minute: ${count || 0}\n`);

  // 6. Show shadow mode concept
  console.log('6. Shadow Mode Concept:');
  console.log('   When enabled: Logs fraud scores without blocking transactions');
  console.log('   When disabled: Can actively block suspicious transactions');
  console.log('   Toggle via: PUT /waterfall/shadow-mode\n');

  console.log('✅ Demo completed successfully!');
  console.log('\nNext steps:');
  console.log('  - Run API server: bun run dev:api');
  console.log('  - Run UI dashboard: bun run dev:ui');
  console.log('  - View documentation: cat README.md');
}

main().catch(console.error);
