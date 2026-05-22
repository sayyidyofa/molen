import { 
  InputSchema, 
  FeatureExtractor, 
  Rule, 
  MLModel, 
  RuleType, 
  TypedRule, 
  Draft, 
  CommittedVersion, 
  DeploymentEnvironment,
  OrchestratorGraph
} from '@molen/shared-types';

export interface IMolenRepository {
  // Schemas
  getSchemas(): Promise<InputSchema[]>;
  addSchema(schema: Omit<InputSchema, 'id'>): Promise<InputSchema>;
  updateSchema(id: string, schema: Partial<InputSchema>): Promise<InputSchema | null>;
  deleteSchema(id: string): Promise<InputSchema | null>;

  // Extractors
  getExtractors(): Promise<FeatureExtractor[]>;
  addExtractor(extractor: Omit<FeatureExtractor, 'id'>): Promise<FeatureExtractor>;
  updateExtractor(id: string, extractor: Partial<FeatureExtractor>): Promise<FeatureExtractor | null>;
  deleteExtractor(id: string): Promise<FeatureExtractor | null>;

  // Rules
  getRules(): Promise<Rule[]>;
  addRule(rule: Omit<Rule, 'id'>): Promise<Rule>;
  updateRule(id: string, rule: Partial<Rule>): Promise<Rule | null>;
  deleteRule(id: string): Promise<Rule | null>;

  // Models
  getModels(): Promise<MLModel[]>;
  addModel(model: Omit<MLModel, 'id'>): Promise<MLModel>;
  updateModel(id: string, model: Partial<MLModel>): Promise<MLModel | null>;
  deleteModel(id: string): Promise<MLModel | null>;

  // Rule Types
  getRuleTypes(): Promise<RuleType[]>;
  addRuleType(ruleType: Omit<RuleType, 'id'>): Promise<RuleType>;
  updateRuleType(id: string, ruleType: Partial<RuleType>): Promise<RuleType | null>;
  deleteRuleType(id: string): Promise<RuleType | null>;

  // Typed Rules
  getTypedRules(): Promise<TypedRule[]>;
  addTypedRule(typedRule: Omit<TypedRule, 'id'>): Promise<TypedRule>;
  updateTypedRule(id: string, typedRule: Partial<TypedRule>): Promise<TypedRule | null>;
  deleteTypedRule(id: string): Promise<TypedRule | null>;

  // Orchestrators
  getDrafts(): Promise<Draft[]>;
  getDraft(id: string): Promise<Draft | null>;
  saveDraft(draft: Draft | Omit<Draft, 'id'>): Promise<Draft>;
  deleteDraft(id: string): Promise<Draft | null>;
  
  // Versions & Deployments
  getVersions(draftId: string): Promise<CommittedVersion[]>;
  getVersion(versionId: string): Promise<CommittedVersion | null>;
  commitVersion(draftId: string): Promise<CommittedVersion>;
  getDeployments(): Promise<DeploymentEnvironment[]>;
  promoteDeployment(name: string, versionId: string): Promise<DeploymentEnvironment>;
}

export interface IEventStream {
  publishDeployment(topic: string, graph: OrchestratorGraph): Promise<void>;
}
