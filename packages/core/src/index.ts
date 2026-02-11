// Client interfaces
export { IElasticClient } from './clients/elastic.interface';
export { IRedisClient } from './clients/redis.interface';
export { IS3Client, S3Config, ModelMetadata } from './clients/s3.interface';
export {
  IKafkaConnectClient,
  KafkaConnectConfig,
  PipelineConfig,
  PipelineStatus,
} from './clients/kafka.interface';
export {
  IKafkaBrokerClient,
  KafkaBrokerConfig,
  TopicConfig,
  ProducerMessage,
  ConsumerMessage,
  TopicMetadata,
} from './clients/kafka-broker.interface';
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
export { RealS3Client } from './clients/s3.real';
export { MockS3Client } from './clients/s3.mock';
export { MockKafkaConnectClient } from './clients/kafka.mock';
export { RealKafkaBrokerClient } from './clients/kafka-broker.real';
export { MockKafkaBrokerClient } from './clients/kafka-broker.mock';
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
