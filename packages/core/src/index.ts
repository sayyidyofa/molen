// Client interfaces
export { IElasticClient } from './clients/elastic.interface';
export { IRedisClient } from './clients/redis.interface';
export { IFlinkClient } from './clients/flink.interface';

// Client implementations
export { RealElasticClient } from './clients/elastic.real';
export { MockElasticClient } from './clients/elastic.mock';
export { RealRedisClient } from './clients/redis.real';
export { MockRedisClient } from './clients/redis.mock';
export { RealFlinkClient } from './clients/flink.real';
export { MockFlinkClient } from './clients/flink.mock';

// Rule evaluator interfaces
export { IRuleEvaluator } from './rules/rule-evaluator.interface';
export { StatelessRuleEvaluator } from './rules/stateless-evaluator';
export { VelocityRuleEvaluator } from './rules/velocity-evaluator';

// Types
export { Transaction, RuleEvaluationResult } from './types/transaction.types';

// Factories
export { ExternalClientFactory } from './factories/client.factory';
export { RuleEvaluatorFactory } from './factories/rule-evaluator.factory';
