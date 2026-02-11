// Client interfaces
export { IElasticClient } from './clients/elastic.interface';
export { IRedisClient } from './clients/redis.interface';
export { IFlinkClient } from './clients/flink.interface';
export { IS3Client, S3Config, ModelMetadata } from './clients/s3.interface';
export {
  IRedpandaConnectClient,
  RedpandaConnectConfig,
  PipelineConfig,
  PipelineStatus,
} from './clients/redpanda.interface';
export {
  IRedpandaBrokerClient,
  RedpandaBrokerConfig,
  TopicConfig,
  ProducerMessage,
  ConsumerMessage,
  TopicMetadata,
} from './clients/redpanda-broker.interface';
export {
  IMLTrainer,
  TrainingConfig,
  TrainingJob,
  ModelVersion,
  ModelComparison,
} from './clients/mltrainer.interface';

// Client implementations
export { RealElasticClient } from './clients/elastic.real';
export { MockElasticClient } from './clients/elastic.mock';
export { RealRedisClient } from './clients/redis.real';
export { MockRedisClient } from './clients/redis.mock';
export { RealFlinkClient } from './clients/flink.real';
export { MockFlinkClient } from './clients/flink.mock';
export { RealS3Client } from './clients/s3.real';
export { MockS3Client } from './clients/s3.mock';
export { MockRedpandaConnectClient } from './clients/redpanda.mock';
export { RealRedpandaBrokerClient } from './clients/redpanda-broker.real';
export { MockRedpandaBrokerClient } from './clients/redpanda-broker.mock';
export { MockMLTrainer } from './clients/mltrainer.mock';

// Rule evaluator interfaces
export { IRuleEvaluator } from './rules/rule-evaluator.interface';
export { StatelessRuleEvaluator } from './rules/stateless-evaluator';
export { VelocityRuleEvaluator } from './rules/velocity-evaluator';

// Types
export { Transaction, RuleEvaluationResult } from './types/transaction.types';

// Factories
export { ExternalClientFactory } from './factories/client.factory';
export { RuleEvaluatorFactory, type RuleEvaluatorConfig } from './factories/rule-evaluator.factory';
