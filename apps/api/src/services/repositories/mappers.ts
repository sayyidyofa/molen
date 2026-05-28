import { 
  InputSchema, 
  SchemaField,
  FeatureExtractor, 
  Rule, 
  MLModel, 
  RuleType, 
  TypedRule, 
  Draft, 
  CommittedVersion, 
  DeploymentEnvironment,
  DataType,
  RuleAction
} from '@molen/shared-types';

export const mapSchema = (s: Record<string, any>): InputSchema => ({
  id: String(s.id),
  name: String(s.name),
  fields: s.fields as SchemaField[],
  version: s.version ? String(s.version) : undefined,
  status: s.status ? String(s.status) : undefined,
});

export const mapExtractor = (e: Record<string, any>): FeatureExtractor => ({
  id: String(e.id),
  name: String(e.name),
  sourceField: String(e.source_field),
  transformation: String(e.transformation),
  outputType: e.output_type as DataType,
});

export const mapRule = (r: Record<string, any>): Rule => ({
  id: String(r.id),
  name: String(r.name),
  condition: String(r.condition),
  anomalyScore: Number(r.anomaly_score),
  action: r.action as RuleAction,
});

export const mapModel = (m: Record<string, any>): MLModel => ({
  id: String(m.id),
  name: String(m.name),
  modelUrl: String(m.model_url),
  outputType: DataType.ANOMALY_SCORE,
  version: m.version ? String(m.version) : undefined,
  accuracy: m.accuracy ? Number(m.accuracy) : undefined,
  fpr: m.fpr ? Number(m.fpr) : undefined,
  status: m.status ? String(m.status) : undefined,
});

export const mapRuleType = (rt: Record<string, any>): RuleType => ({
  id: String(rt.id),
  name: String(rt.name),
  baseType: String(rt.base_type),
  schema: rt.schema as Record<string, unknown>,
  description: rt.description ? String(rt.description) : undefined,
});

export const mapTypedRule = (tr: Record<string, any>): TypedRule => ({
  id: String(tr.id),
  name: String(tr.name),
  ruleTypeId: String(tr.rule_type_id),
  description: tr.description ? String(tr.description) : undefined,
  mode: String(tr.mode),
  visualBlocks: tr.visual_blocks as Record<string, unknown>,
  codeExpression: tr.code_expression ? String(tr.code_expression) : undefined,
  action: tr.action as RuleAction,
  priority: Number(tr.priority),
  status: String(tr.status),
});

export const mapDraft = (d: Record<string, any>): Draft => ({
  id: String(d.id),
  name: String(d.name),
  description: d.description ? String(d.description) : undefined,
  graph: d.graph as any,
  updatedAt: new Date(String(d.updated_at)),
  status: d.status ? String(d.status) : undefined,
});

export const mapVersion = (v: Record<string, any>): CommittedVersion => ({
  id: String(v.id),
  draftId: String(v.draft_id),
  version: Number(v.version),
  graph: v.graph as any,
  committedAt: new Date(String(v.committed_at)),
});

export const mapDeployment = (d: Record<string, any>): DeploymentEnvironment => ({
  id: String(d.id),
  name: String(d.name),
  activeVersionId: String(d.active_version_id),
  deployedAt: new Date(String(d.deployed_at)),
});
