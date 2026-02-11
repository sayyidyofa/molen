import { Elysia, t } from 'elysia';
import { MLService } from '../services/ml.service';

const mlService = new MLService();

/**
 * ML Training and Model Management routes
 * Implements REQ-1 (Self-Service Model Training) and REQ-2 (Shadow Mode Deployment)
 */
export const mlRoutes = new Elysia({ prefix: '/ml' })
  /**
   * Submit a new training job
   * POST /ml/training
   */
  .post(
    '/training',
    async ({ body }) => {
      const job = await mlService.submitTraining(body);
      return {
        success: true,
        job,
      };
    },
    {
      body: t.Object({
        modelName: t.String(),
        modelType: t.Union([t.Literal('xgboost'), t.Literal('lightgbm'), t.Literal('sklearn')]),
        dataSource: t.Object({
          startDate: t.String(),
          endDate: t.String(),
          bucket: t.String(),
          prefix: t.Optional(t.String()),
        }),
        hyperparameters: t.Optional(t.Record(t.String(), t.Unknown())),
        features: t.Optional(t.Array(t.String())),
      }),
    }
  )

  /**
   * Get training job status
   * GET /ml/training/:jobId
   */
  .get('/training/:jobId', async ({ params: { jobId } }) => {
    const job = await mlService.getTrainingStatus(jobId);
    return {
      success: true,
      job,
    };
  })

  /**
   * List training jobs
   * GET /ml/training
   */
  .get('/training', async ({ query }) => {
    const limit = query.limit ? parseInt(query.limit as string) : 10;
    const jobs = await mlService.listTrainingJobs(limit);
    return {
      success: true,
      jobs,
    };
  })

  /**
   * Cancel a training job
   * DELETE /ml/training/:jobId
   */
  .delete('/training/:jobId', async ({ params: { jobId } }) => {
    await mlService.cancelTraining(jobId);
    return {
      success: true,
      message: 'Training job cancelled',
    };
  })

  /**
   * List models
   * GET /ml/models
   */
  .get('/models', async ({ query }) => {
    const type = query.type as 'live' | 'candidate' | 'archived' | undefined;
    const models = await mlService.listModels(type);
    return {
      success: true,
      models,
    };
  })

  /**
   * Get a specific model
   * GET /ml/models/:modelId
   */
  .get('/models/:modelId', async ({ params: { modelId } }) => {
    const model = await mlService.getModel(modelId);
    return {
      success: true,
      model,
    };
  })

  /**
   * Promote a candidate model to live
   * POST /ml/models/:modelId/promote
   */
  .post('/models/:modelId/promote', async ({ params: { modelId } }) => {
    const model = await mlService.promoteModel(modelId);
    return {
      success: true,
      message: 'Model promoted to live',
      model,
    };
  })

  /**
   * Compare models
   * GET /ml/models/compare
   */
  .get('/models/compare', async ({ query }) => {
    const { liveModelId, candidateModelId } = query as {
      liveModelId: string;
      candidateModelId: string;
    };
    const comparison = await mlService.compareModels(liveModelId, candidateModelId);
    return {
      success: true,
      comparison,
    };
  })

  /**
   * Archive a model
   * POST /ml/models/:modelId/archive
   */
  .post('/models/:modelId/archive', async ({ params: { modelId } }) => {
    await mlService.archiveModel(modelId);
    return {
      success: true,
      message: 'Model archived',
    };
  });
