import { ExternalClientFactory } from '@molen/core';
import type {
  TrainingConfig,
  TrainingJob,
  ModelVersion,
  ModelComparison,
} from '@molen/core';

/**
 * ML Training Service
 * Handles self-service model training operations
 */
export class MLService {
  private mlTrainer = ExternalClientFactory.createMLTrainer();

  /**
   * Submit a new training job
   */
  async submitTraining(config: TrainingConfig): Promise<TrainingJob> {
    return await this.mlTrainer.submitTraining(config);
  }

  /**
   * Get training job status
   */
  async getTrainingStatus(jobId: string): Promise<TrainingJob> {
    return await this.mlTrainer.getTrainingStatus(jobId);
  }

  /**
   * List recent training jobs
   */
  async listTrainingJobs(limit?: number): Promise<TrainingJob[]> {
    return await this.mlTrainer.listTrainingJobs(limit);
  }

  /**
   * Cancel a training job
   */
  async cancelTraining(jobId: string): Promise<void> {
    return await this.mlTrainer.cancelTraining(jobId);
  }

  /**
   * List models
   */
  async listModels(type?: 'live' | 'candidate' | 'archived'): Promise<ModelVersion[]> {
    return await this.mlTrainer.listModels(type);
  }

  /**
   * Get a specific model
   */
  async getModel(modelId: string): Promise<ModelVersion> {
    return await this.mlTrainer.getModel(modelId);
  }

  /**
   * Promote a candidate model to live
   */
  async promoteModel(modelId: string): Promise<ModelVersion> {
    return await this.mlTrainer.promoteModel(modelId);
  }

  /**
   * Compare live and candidate models
   */
  async compareModels(liveModelId: string, candidateModelId: string): Promise<ModelComparison> {
    return await this.mlTrainer.compareModels(liveModelId, candidateModelId);
  }

  /**
   * Archive a model
   */
  async archiveModel(modelId: string): Promise<void> {
    return await this.mlTrainer.archiveModel(modelId);
  }
}
