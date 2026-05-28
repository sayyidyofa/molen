import { 
  InputSchema, 
  FeatureExtractor, 
  Rule, 
  MLModel, 
  RuleType, 
  TypedRule, 
  Draft, 
  CommittedVersion, 
  DeploymentEnvironment
} from '@molen/shared-types';
import { IMolenRepository } from './interfaces';
import postgres from 'postgres';
import { SchemaRepository } from './repositories/SchemaRepository';
import { ExtractorRepository } from './repositories/ExtractorRepository';
import { RuleRepository } from './repositories/RuleRepository';
import { ModelRepository } from './repositories/ModelRepository';
import { OrchestratorRepository } from './repositories/OrchestratorRepository';

export class PostgresRepository implements IMolenRepository {
  private sql: postgres.Sql;
  private schemas: SchemaRepository;
  private extractors: ExtractorRepository;
  private rules: RuleRepository;
  private models: ModelRepository;
  private orchestrators: OrchestratorRepository;

  constructor(url: string) {
    this.sql = postgres(url);
    this.schemas = new SchemaRepository(this.sql);
    this.extractors = new ExtractorRepository(this.sql);
    this.rules = new RuleRepository(this.sql);
    this.models = new ModelRepository(this.sql);
    this.orchestrators = new OrchestratorRepository(this.sql);
  }

  // Schema delegation
  getSchemas = () => this.schemas.getSchemas();
  addSchema = (schema: Omit<InputSchema, 'id'>) => this.schemas.addSchema(schema);
  updateSchema = (id: string, schema: Partial<InputSchema>) => this.schemas.updateSchema(id, schema);
  deleteSchema = (id: string) => this.schemas.deleteSchema(id);

  // Extractor delegation
  getExtractors = () => this.extractors.getExtractors();
  addExtractor = (extractor: Omit<FeatureExtractor, 'id'>) => this.extractors.addExtractor(extractor);
  deleteExtractor = (id: string) => this.extractors.deleteExtractor(id);
  updateExtractor = (id: string, extractor: Partial<FeatureExtractor>) => this.extractors.updateExtractor(id, extractor);

  // Rule delegation
  getRules = () => this.rules.getRules();
  addRule = (rule: Omit<Rule, 'id'>) => this.rules.addRule(rule);
  deleteRule = (id: string) => this.rules.deleteRule(id);
  updateRule = (id: string, rule: Partial<Rule>) => this.rules.updateRule(id, rule);

  getRuleTypes = () => this.rules.getRuleTypes();
  addRuleType = (ruleType: Omit<RuleType, 'id'>) => this.rules.addRuleType(ruleType);
  deleteRuleType = (id: string) => this.rules.deleteRuleType(id);
  updateRuleType = (id: string, ruleType: Partial<RuleType>) => this.rules.updateRuleType(id, ruleType);

  getTypedRules = () => this.rules.getTypedRules();
  addTypedRule = (typedRule: Omit<TypedRule, 'id'>) => this.rules.addTypedRule(typedRule);
  deleteTypedRule = (id: string) => this.rules.deleteTypedRule(id);
  updateTypedRule = (id: string, typedRule: Partial<TypedRule>) => this.rules.updateTypedRule(id, typedRule);

  // Model delegation
  getModels = () => this.models.getModels();
  addModel = (model: Omit<MLModel, 'id'>) => this.models.addModel(model);
  deleteModel = (id: string) => this.models.deleteModel(id);
  updateModel = (id: string, model: Partial<MLModel>) => this.models.updateModel(id, model);

  // Orchestrator delegation
  getDrafts = () => this.orchestrators.getDrafts();
  getDraft = (id: string) => this.orchestrators.getDraft(id);
  saveDraft = (draft: Partial<Draft>) => this.orchestrators.saveDraft(draft);
  deleteDraft = (id: string) => this.orchestrators.deleteDraft(id);
  getVersions = (draftId: string) => this.orchestrators.getVersions(draftId);
  getVersion = (versionId: string) => this.orchestrators.getVersion(versionId);
  commitVersion = (draftId: string) => this.orchestrators.commitVersion(draftId);
  getDeployments = () => this.orchestrators.getDeployments();
  promoteDeployment = (name: string, versionId: string) => this.orchestrators.promoteDeployment(name, versionId);
}
