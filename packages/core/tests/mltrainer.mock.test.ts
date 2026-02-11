import { describe, test, expect, beforeEach } from 'bun:test';
import { MockMLTrainer } from '../src/clients/mltrainer.mock';
import type { TrainingConfig } from '../src/clients/mltrainer.interface';

describe('MockMLTrainer', () => {
  let trainer: MockMLTrainer;

  beforeEach(() => {
    trainer = new MockMLTrainer();
    trainer.clearMockData();
  });

  test('should submit a training job', async () => {
    const config: TrainingConfig = {
      modelName: 'fraud-detector-v1',
      modelType: 'xgboost',
      dataSource: {
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        bucket: 'ml-training-data',
      },
    };

    const job = await trainer.submitTraining(config);

    expect(job.jobId).toBeDefined();
    expect(job.modelName).toBe('fraud-detector-v1');
    expect(job.status).toBe('queued');
  });

  test('should complete training job and create model', async () => {
    const config: TrainingConfig = {
      modelName: 'fraud-detector-v1',
      modelType: 'xgboost',
      dataSource: {
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        bucket: 'ml-training-data',
      },
    };

    const job = await trainer.submitTraining(config);

    // Wait for mock async completion
    await new Promise((resolve) => setTimeout(resolve, 150));

    const status = await trainer.getTrainingStatus(job.jobId);
    expect(status.status).toBe('completed');
    expect(status.metrics).toBeDefined();
    expect(status.artifactPath).toBeDefined();
  });

  test('should list training jobs', async () => {
    const config: TrainingConfig = {
      modelName: 'fraud-detector-v1',
      modelType: 'xgboost',
      dataSource: {
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        bucket: 'ml-training-data',
      },
    };

    await trainer.submitTraining(config);
    await trainer.submitTraining({ ...config, modelName: 'fraud-detector-v2' });

    const jobs = await trainer.listTrainingJobs();
    expect(jobs.length).toBeGreaterThanOrEqual(2);
  });

  test('should cancel a training job', async () => {
    const config: TrainingConfig = {
      modelName: 'fraud-detector-v1',
      modelType: 'xgboost',
      dataSource: {
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        bucket: 'ml-training-data',
      },
    };

    const job = await trainer.submitTraining(config);
    await trainer.cancelTraining(job.jobId);

    const status = await trainer.getTrainingStatus(job.jobId);
    expect(status.status).toBe('failed');
    expect(status.error).toContain('Cancelled');
  });

  test('should list models', async () => {
    const config: TrainingConfig = {
      modelName: 'fraud-detector-v1',
      modelType: 'xgboost',
      dataSource: {
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        bucket: 'ml-training-data',
      },
    };

    await trainer.submitTraining(config);
    await new Promise((resolve) => setTimeout(resolve, 150));

    const models = await trainer.listModels();
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].type).toBe('candidate');
  });

  test('should promote a candidate model to live', async () => {
    const config: TrainingConfig = {
      modelName: 'fraud-detector-v1',
      modelType: 'xgboost',
      dataSource: {
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        bucket: 'ml-training-data',
      },
    };

    await trainer.submitTraining(config);
    await new Promise((resolve) => setTimeout(resolve, 150));

    const candidateModels = await trainer.listModels('candidate');
    const promoted = await trainer.promoteModel(candidateModels[0].modelId);

    expect(promoted.type).toBe('live');
  });

  test('should compare models', async () => {
    const config: TrainingConfig = {
      modelName: 'fraud-detector',
      modelType: 'xgboost',
      dataSource: {
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        bucket: 'ml-training-data',
      },
    };

    // Create and promote first model
    await trainer.submitTraining(config);
    await new Promise((resolve) => setTimeout(resolve, 150));
    const models1 = await trainer.listModels('candidate');
    await trainer.promoteModel(models1[0].modelId);

    // Create second candidate model
    await trainer.submitTraining({ ...config, modelName: 'fraud-detector-v2' });
    await new Promise((resolve) => setTimeout(resolve, 150));

    const liveModels = await trainer.listModels('live');
    const candidateModels = await trainer.listModels('candidate');

    const comparison = await trainer.compareModels(liveModels[0].modelId, candidateModels[0].modelId);

    expect(comparison.liveModel).toBeDefined();
    expect(comparison.candidateModel).toBeDefined();
    expect(comparison.comparison).toBeDefined();
    expect(comparison.recommendation).toBeDefined();
  });

  test('should archive a model', async () => {
    const config: TrainingConfig = {
      modelName: 'fraud-detector-v1',
      modelType: 'xgboost',
      dataSource: {
        startDate: '2026-01-01',
        endDate: '2026-01-07',
        bucket: 'ml-training-data',
      },
    };

    await trainer.submitTraining(config);
    await new Promise((resolve) => setTimeout(resolve, 150));

    const models = await trainer.listModels('candidate');
    await trainer.archiveModel(models[0].modelId);

    const archivedModels = await trainer.listModels('archived');
    expect(archivedModels.length).toBeGreaterThan(0);
  });
});
