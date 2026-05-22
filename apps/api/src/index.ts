/**
 * BUN & KAFKAJS COMPATIBILITY PATCH
 * KafkaJS uses -1 to initialize some timers, which results in negative timeouts (e.g., -1 - Date.now()).
 * Bun's setTimeout warns on negative values. This patch silently treats them as 0.
 */
const nativeSetTimeout = setTimeout;
// @ts-ignore
globalThis.setTimeout = (cb, ms, ...args) => {
  return nativeSetTimeout(cb, ms < 0 ? 0 : ms, ...args);
};

import { Elysia, t } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { 
  DataType, 
  RuleAction, 
} from '@molen/shared-types';
import { services } from './services/factory';

export const app = new Elysia()
  .onRequest(({ set }) => {
    set.headers['X-Debug'] = 'true';
    set.headers['Access-Control-Allow-Origin'] = '*';
    set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    set.headers['Access-Control-Allow-Credentials'] = 'true';
  })
  .all('*', ({ request }) => {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }
  })
  .use(swagger())
  .onBeforeHandle(({ request }) => {
    console.log(`[${request.method}] ${request.url}`);
  })
  .get('/health', () => ({ status: 'ok' }))
  .get('/test-async', async () => {
    await new Promise(r => setTimeout(r, 10));
    return { status: 'async-ok' };
  })
  
  .get('/system-health', () => [
    { service: "Kafka Cluster", status: "operational", uptime: "99.98%" },
    { service: "Rust Engine", status: "operational", uptime: "99.99%" },
    { service: "Feature Store", status: "operational", uptime: "99.95%" },
    { service: "Model Registry", status: "operational", uptime: "100%" },
  ])

  .get('/metrics', () => ({
    activeWorkflows: 12,
    avgLatency: 24,
    flaggedTransactions: 2847,
    modelAccuracy: 98.4,
    modelFpr: 0.8,
  }))
  
  // Schemas
  .get('/schemas', async () => services.getRepository().getSchemas())
  .post('/schemas', async ({ body }) => services.getRepository().addSchema(body as any), {
    body: t.Object({
      name: t.String(),
      fields: t.Array(t.Unknown()),
      version: t.Optional(t.String()),
      status: t.Optional(t.String())
    })
  })
  .put('/schemas/:id', async ({ params: { id }, body }) => services.getRepository().updateSchema(id, body as any), {
    body: t.Object({
      name: t.Optional(t.String()),
      fields: t.Optional(t.Array(t.Unknown())),
      version: t.Optional(t.String()),
      status: t.Optional(t.String())
    })
  })
  .delete('/schemas/:id', async ({ params: { id } }) => services.getRepository().deleteSchema(id))

  // Rule Types
  .get('/rule-types', async () => services.getRepository().getRuleTypes())
  .post('/rule-types', async ({ body }) => services.getRepository().addRuleType({
    ...body,
    baseType: body.base_type,
  } as any), {
    body: t.Object({
      id: t.Optional(t.String()),
      name: t.String(),
      base_type: t.String(),
      schema: t.Optional(t.Record(t.String(), t.Unknown())),
      description: t.Optional(t.String())
    })
  })
  .delete('/rule-types/:id', async ({ params: { id } }) => services.getRepository().deleteRuleType(id))
  .put('/rule-types/:id', async ({ params: { id }, body }) => services.getRepository().updateRuleType(id, {
    ...body,
    baseType: body.base_type,
  } as any), {
    body: t.Object({
      name: t.Optional(t.String()),
      base_type: t.Optional(t.String()),
      schema: t.Optional(t.Record(t.String(), t.Unknown())),
      description: t.Optional(t.String())
    })
  })

  // Typed Rules
  .get('/typed-rules', async () => services.getRepository().getTypedRules())
  .post('/typed-rules', async ({ body }) => services.getRepository().addTypedRule({
    ...body,
    ruleTypeId: body.rule_type_id,
    visualBlocks: body.visual_blocks,
    codeExpression: body.code_expression,
  } as any), {
    body: t.Object({
      name: t.String(),
      rule_type_id: t.String(),
      description: t.Optional(t.String()),
      mode: t.String(),
      visual_blocks: t.Optional(t.Record(t.String(), t.Unknown())),
      code_expression: t.Optional(t.String()),
      action: t.Enum(RuleAction),
      priority: t.Number(),
      status: t.String()
    })
  })
  .delete('/typed-rules/:id', async ({ params: { id } }) => services.getRepository().deleteTypedRule(id))
  .put('/typed-rules/:id', async ({ params: { id }, body }) => services.getRepository().updateTypedRule(id, {
    ...body,
    ruleTypeId: body.rule_type_id,
    visualBlocks: body.visual_blocks,
    codeExpression: body.code_expression,
  } as any), {
    body: t.Object({
      name: t.Optional(t.String()),
      rule_type_id: t.Optional(t.String()),
      description: t.Optional(t.String()),
      mode: t.Optional(t.String()),
      visual_blocks: t.Optional(t.Record(t.String(), t.Unknown())),
      code_expression: t.Optional(t.String()),
      action: t.Optional(t.Enum(RuleAction)),
      priority: t.Optional(t.Number()),
      status: t.Optional(t.String())
    })
  })

  // Extractors
  .get('/extractors', async () => services.getRepository().getExtractors())
  .post('/extractors', async ({ body }) => services.getRepository().addExtractor(body), {
    body: t.Object({
      name: t.String(),
      sourceField: t.String(),
      transformation: t.String(),
      outputType: t.Enum(DataType)
    })
  })
  .delete('/extractors/:id', async ({ params: { id } }) => services.getRepository().deleteExtractor(id))
  .put('/extractors/:id', async ({ params: { id }, body }) => services.getRepository().updateExtractor(id, body as any), {
    body: t.Object({
      name: t.Optional(t.String()),
      sourceField: t.Optional(t.String()),
      transformation: t.Optional(t.String()),
      outputType: t.Optional(t.Enum(DataType))
    })
  })

  // Rules
  .get('/rules', async () => services.getRepository().getRules())
  .post('/rules', async ({ body }) => services.getRepository().addRule(body), {
    body: t.Object({
      name: t.String(),
      condition: t.String(),
      anomalyScore: t.Number(),
      action: t.Enum(RuleAction)
    })
  })
  .delete('/rules/:id', async ({ params: { id } }) => services.getRepository().deleteRule(id))
  .put('/rules/:id', async ({ params: { id }, body }) => services.getRepository().updateRule(id, body as any), {
    body: t.Object({
      name: t.Optional(t.String()),
      condition: t.Optional(t.String()),
      anomalyScore: t.Optional(t.Number()),
      action: t.Optional(t.Enum(RuleAction))
    })
  })

  // Models
  .get('/models', async () => services.getRepository().getModels())
  .post('/models', async ({ body }) => services.getRepository().addModel(body), {
    body: t.Object({
      name: t.String(),
      modelUrl: t.String(),
      outputType: t.Literal(DataType.ANOMALY_SCORE),
      version: t.Optional(t.String()),
      accuracy: t.Optional(t.Number()),
      fpr: t.Optional(t.Number()),
      status: t.Optional(t.String())
    })
  })
  .delete('/models/:id', async ({ params: { id } }) => services.getRepository().deleteModel(id))
  .put('/models/:id', async ({ params: { id }, body }) => services.getRepository().updateModel(id, body as any), {
    body: t.Object({
      name: t.Optional(t.String()),
      modelUrl: t.Optional(t.String()),
      outputType: t.Optional(t.Literal(DataType.ANOMALY_SCORE)),
      version: t.Optional(t.String()),
      accuracy: t.Optional(t.Number()),
      fpr: t.Optional(t.Number()),
      status: t.Optional(t.String())
    })
  })

  // Orchestrators (Drafts & Versions)
  .get('/orchestrators/drafts', async () => services.getRepository().getDrafts())
  .get('/orchestrators/drafts/:id', async ({ params: { id } }) => services.getRepository().getDraft(id))
  .post('/orchestrators/drafts', async ({ body }) => services.getRepository().saveDraft(body as any), {
    body: t.Object({
      id: t.Optional(t.String()),
      name: t.String(),
      graph: t.Object({
        nodes: t.Array(t.Unknown()),
        edges: t.Array(t.Unknown())
      }),
      updatedAt: t.Optional(t.Any())
    })
  })
  .delete('/orchestrators/drafts/:id', async ({ params: { id } }) => services.getRepository().deleteDraft(id))
  .post('/orchestrators/commit/:id', async ({ params: { id } }) => services.getRepository().commitVersion(id))
  .get('/orchestrators/versions/:id', async ({ params: { id } }) => services.getRepository().getVersions(id))

  // Deployments
  .get('/deployments', async () => services.getRepository().getDeployments())
  .post('/deployments/promote', async ({ body }) => {
    const { name, versionId } = body;
    const version = await services.getRepository().getVersion(versionId);
    if (!version) throw new Error('Version not found');

    const deployment = await services.getRepository().promoteDeployment(name, versionId);

    // Publish to Redpanda
    const eventStream = await services.getEventStream();
    await eventStream.publishDeployment(process.env.MOLEN_CONTROL_TOPIC || 'molen_control_dev', version.graph);

    return deployment;
  }, {
    body: t.Object({
      name: t.String(),
      versionId: t.String()
    })
  });

if (process.env.NODE_ENV !== 'test') {
  app.listen({
    port: Number(process.env.API_PORT || 3000),
    hostname: process.env.API_HOST || '0.0.0.0'
  });
  console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
}
