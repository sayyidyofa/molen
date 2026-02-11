/**
 * ML Training Service interface
 * Handles self-service model training for fraud detection
 */

export interface TrainingConfig {
  modelName: string;
  modelType: 'xgboost' | 'lightgbm' | 'sklearn';
  dataSource: {
    startDate: string; // ISO format
    endDate: string;
    bucket: string;
    prefix?: string;
  };
  hyperparameters?: Record<string, unknown>;
  features?: string[];
}

export interface TrainingJob {
  jobId: string;
  modelName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    auc?: number;
  };
  error?: string;
  artifactPath?: string; // S3 path to trained model
}

export interface ModelVersion {
  modelId: string;
  version: string;
  name: string;
  type: 'live' | 'candidate' | 'archived';
  createdAt: string;
  trainedBy?: string;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    falsePositiveRate: number;
  };
  artifactPath: string;
  metadata?: Record<string, unknown>;
}

export interface ModelComparison {
  liveModel: ModelVersion;
  candidateModel: ModelVersion;
  comparison: {
    accuracyDelta: number;
    precisionDelta: number;
    recallDelta: number;
    f1Delta: number;
    falsePositiveDelta: number;
  };
  recommendation: 'promote' | 'reject' | 'needs_more_data';
  shadowModeResults?: {
    totalTransactions: number;
    agreementRate: number;
    candidateFalsePositives: number;
    liveFalsePositives: number;
  };
}

/**
 * IMLTrainer - Interface for ML model training operations
 * Enables self-service model training for fraud analysts
 */
export interface IMLTrainer {
  /**
   * Submit a new training job
   */
  submitTraining(config: TrainingConfig): Promise<TrainingJob>;

  /**
   * Get status and details of a training job
   */
  getTrainingStatus(jobId: string): Promise<TrainingJob>;

  /**
   * List all training jobs
   */
  listTrainingJobs(limit?: number): Promise<TrainingJob[]>;

  /**
   * Cancel a running training job
   */
  cancelTraining(jobId: string): Promise<void>;

  /**
   * Get all model versions
   */
  listModels(type?: 'live' | 'candidate' | 'archived'): Promise<ModelVersion[]>;

  /**
   * Get a specific model version
   */
  getModel(modelId: string): Promise<ModelVersion>;

  /**
   * Promote a candidate model to live
   */
  promoteModel(modelId: string): Promise<ModelVersion>;

  /**
   * Compare live and candidate models
   */
  compareModels(liveModelId: string, candidateModelId: string): Promise<ModelComparison>;

  /**
   * Archive a model version
   */
  archiveModel(modelId: string): Promise<void>;

  /**
   * Close the client connection
   */
  close(): Promise<void>;
}
