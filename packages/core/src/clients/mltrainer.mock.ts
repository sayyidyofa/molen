import {
  IMLTrainer,
  TrainingConfig,
  TrainingJob,
  ModelVersion,
  ModelComparison,
} from './mltrainer.interface';

/**
 * Mock implementation of ML Training service for testing
 */
export class MockMLTrainer implements IMLTrainer {
  private jobs: Map<string, TrainingJob> = new Map();
  private models: Map<string, ModelVersion> = new Map();
  private jobCounter = 0;
  private modelCounter = 0;

  async submitTraining(config: TrainingConfig): Promise<TrainingJob> {
    const jobId = `job-${++this.jobCounter}`;
    const job: TrainingJob = {
      jobId,
      modelName: config.modelName,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(jobId, job);

    // Simulate async training completion
    setTimeout(() => {
      this.completeTraining(jobId);
    }, 100);

    return job;
  }

  private completeTraining(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.startedAt = new Date().toISOString();
    job.completedAt = new Date().toISOString();
    job.metrics = {
      accuracy: 0.92,
      precision: 0.89,
      recall: 0.87,
      f1Score: 0.88,
      auc: 0.94,
    };
    job.artifactPath = `s3://ml-models/trained/${job.modelName}-v${this.modelCounter + 1}.bin`;

    // Create a new model version
    const modelId = `model-${++this.modelCounter}`;
    const model: ModelVersion = {
      modelId,
      version: `v${this.modelCounter}`,
      name: job.modelName,
      type: 'candidate',
      createdAt: job.completedAt,
      metrics: {
        accuracy: job.metrics.accuracy!,
        precision: job.metrics.precision!,
        recall: job.metrics.recall!,
        f1Score: job.metrics.f1Score!,
        auc: job.metrics.auc!,
        falsePositiveRate: 0.11,
      },
      artifactPath: job.artifactPath,
    };
    this.models.set(modelId, model);
  }

  async getTrainingStatus(jobId: string): Promise<TrainingJob> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Training job ${jobId} not found`);
    }
    return job;
  }

  async listTrainingJobs(limit = 10): Promise<TrainingJob[]> {
    const jobs = Array.from(this.jobs.values());
    return jobs.slice(-limit).reverse();
  }

  async cancelTraining(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Training job ${jobId} not found`);
    }
    if (job.status !== 'queued' && job.status !== 'running') {
      throw new Error(`Cannot cancel job in ${job.status} state`);
    }
    job.status = 'failed';
    job.error = 'Cancelled by user';
  }

  async listModels(type?: 'live' | 'candidate' | 'archived'): Promise<ModelVersion[]> {
    const models = Array.from(this.models.values());
    if (type) {
      return models.filter((m) => m.type === type);
    }
    return models;
  }

  async getModel(modelId: string): Promise<ModelVersion> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    return model;
  }

  async promoteModel(modelId: string): Promise<ModelVersion> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    if (model.type !== 'candidate') {
      throw new Error(`Only candidate models can be promoted`);
    }

    // Demote current live model
    for (const [id, m] of this.models.entries()) {
      if (m.type === 'live' && m.name === model.name) {
        m.type = 'archived';
        this.models.set(id, m);
      }
    }

    // Promote candidate to live
    model.type = 'live';
    this.models.set(modelId, model);

    return model;
  }

  async compareModels(liveModelId: string, candidateModelId: string): Promise<ModelComparison> {
    const liveModel = await this.getModel(liveModelId);
    const candidateModel = await this.getModel(candidateModelId);

    const comparison: ModelComparison = {
      liveModel,
      candidateModel,
      comparison: {
        accuracyDelta: candidateModel.metrics.accuracy - liveModel.metrics.accuracy,
        precisionDelta: candidateModel.metrics.precision - liveModel.metrics.precision,
        recallDelta: candidateModel.metrics.recall - liveModel.metrics.recall,
        f1Delta: candidateModel.metrics.f1Score - liveModel.metrics.f1Score,
        falsePositiveDelta:
          candidateModel.metrics.falsePositiveRate - liveModel.metrics.falsePositiveRate,
      },
      recommendation: 'promote',
      shadowModeResults: {
        totalTransactions: 10000,
        agreementRate: 0.95,
        candidateFalsePositives: 110,
        liveFalsePositives: 150,
      },
    };

    // Simple recommendation logic
    if (comparison.comparison.accuracyDelta > 0.02) {
      comparison.recommendation = 'promote';
    } else if (comparison.comparison.accuracyDelta < -0.02) {
      comparison.recommendation = 'reject';
    } else {
      comparison.recommendation = 'needs_more_data';
    }

    return comparison;
  }

  async archiveModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }
    model.type = 'archived';
    this.models.set(modelId, model);
  }

  async close(): Promise<void> {
    // Mock close - no cleanup needed
  }

  // Test utility methods
  clearMockData(): void {
    this.jobs.clear();
    this.models.clear();
    this.jobCounter = 0;
    this.modelCounter = 0;
  }

  getMockJob(jobId: string): TrainingJob | undefined {
    return this.jobs.get(jobId);
  }

  getMockModel(modelId: string): ModelVersion | undefined {
    return this.models.get(modelId);
  }
}
