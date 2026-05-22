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
} from '@molen/shared-types';
import { IMolenRepository } from './interfaces';

export class MockRepository implements IMolenRepository {
  private schemas: InputSchema[] = [];
  private extractors: FeatureExtractor[] = [];
  private rules: Rule[] = [];
  private models: MLModel[] = [];
  private ruleTypes: RuleType[] = [];
  private typedRules: TypedRule[] = [];
  private drafts: Draft[] = [];
  private versions: CommittedVersion[] = [];
  private deployments: DeploymentEnvironment[] = [];

  async getSchemas() { return this.schemas; }
  async addSchema(schema: Omit<InputSchema, 'id'>) {
    const newSchema = { id: Math.random().toString(), ...schema } as InputSchema;
    this.schemas.push(newSchema);
    return newSchema;
  }
  async updateSchema(id: string, schema: Partial<InputSchema>) {
    const index = this.schemas.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.schemas[index] = { ...this.schemas[index], ...schema };
    return this.schemas[index];
  }
  async deleteSchema(id: string) {
    const index = this.schemas.findIndex(s => s.id === id);
    if (index === -1) return null;
    return this.schemas.splice(index, 1)[0];
  }

  async getExtractors() { return this.extractors; }
  async addExtractor(extractor: Omit<FeatureExtractor, 'id'>) {
    const newExtractor = { id: Math.random().toString(), ...extractor } as FeatureExtractor;
    this.extractors.push(newExtractor);
    return newExtractor;
  }
  async updateExtractor(id: string, extractor: Partial<FeatureExtractor>) {
    const index = this.extractors.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.extractors[index] = { ...this.extractors[index], ...extractor };
    return this.extractors[index];
  }
  async deleteExtractor(id: string) {
    const index = this.extractors.findIndex(e => e.id === id);
    if (index === -1) return null;
    return this.extractors.splice(index, 1)[0];
  }

  async getRules() { return this.rules; }
  async addRule(rule: Omit<Rule, 'id'>) {
    const newRule = { id: Math.random().toString(), ...rule } as Rule;
    this.rules.push(newRule);
    return newRule;
  }
  async updateRule(id: string, rule: Partial<Rule>) {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return null;
    this.rules[index] = { ...this.rules[index], ...rule };
    return this.rules[index];
  }
  async deleteRule(id: string) {
    const index = this.rules.findIndex(r => r.id === id);
    if (index === -1) return null;
    return this.rules.splice(index, 1)[0];
  }

  async getModels() { return this.models; }
  async addModel(model: Omit<MLModel, 'id'>) {
    const newModel = { id: Math.random().toString(), ...model } as MLModel;
    this.models.push(newModel);
    return newModel;
  }
  async updateModel(id: string, model: Partial<MLModel>) {
    const index = this.models.findIndex(m => m.id === id);
    if (index === -1) return null;
    this.models[index] = { ...this.models[index], ...model };
    return this.models[index];
  }
  async deleteModel(id: string) {
    const index = this.models.findIndex(m => m.id === id);
    if (index === -1) return null;
    return this.models.splice(index, 1)[0];
  }

  async getRuleTypes() { return this.ruleTypes; }
  async addRuleType(ruleType: Omit<RuleType, 'id'>) {
    const newRT = { id: Math.random().toString(), ...ruleType } as RuleType;
    this.ruleTypes.push(newRT);
    return newRT;
  }
  async updateRuleType(id: string, ruleType: Partial<RuleType>) {
    const index = this.ruleTypes.findIndex(rt => rt.id === id);
    if (index === -1) return null;
    this.ruleTypes[index] = { ...this.ruleTypes[index], ...ruleType };
    return this.ruleTypes[index];
  }
  async deleteRuleType(id: string) {
    const index = this.ruleTypes.findIndex(rt => rt.id === id);
    if (index === -1) return null;
    return this.ruleTypes.splice(index, 1)[0];
  }

  async getTypedRules() { return this.typedRules; }
  async addTypedRule(typedRule: Omit<TypedRule, 'id'>) {
    const newTR = { id: Math.random().toString(), ...typedRule } as TypedRule;
    this.typedRules.push(newTR);
    return newTR;
  }
  async updateTypedRule(id: string, typedRule: Partial<TypedRule>) {
    const index = this.typedRules.findIndex(tr => tr.id === id);
    if (index === -1) return null;
    this.typedRules[index] = { ...this.typedRules[index], ...typedRule };
    return this.typedRules[index];
  }
  async deleteTypedRule(id: string) {
    const index = this.typedRules.findIndex(tr => tr.id === id);
    if (index === -1) return null;
    return this.typedRules.splice(index, 1)[0];
  }

  async getDrafts() { return this.drafts; }
  async getDraft(id: string) { return this.drafts.find(d => d.id === id) || null; }
  async saveDraft(draft: Draft | Omit<Draft, 'id'>) {
    if ('id' in draft && draft.id) {
      const index = this.drafts.findIndex(d => d.id === draft.id);
      if (index !== -1) {
        this.drafts[index] = { ...this.drafts[index], ...draft, updatedAt: new Date() } as Draft;
        return this.drafts[index];
      }
    }
    const newDraft = { id: Math.random().toString(), ...draft, updatedAt: new Date() } as Draft;
    this.drafts.push(newDraft);
    return newDraft;
  }
  async deleteDraft(id: string) {
    const index = this.drafts.findIndex(d => d.id === id);
    if (index === -1) return null;
    return this.drafts.splice(index, 1)[0];
  }

  async getVersions(draftId: string) { return this.versions.filter(v => v.draftId === draftId); }
  async getVersion(versionId: string) { return this.versions.find(v => v.id === versionId) || null; }
  async commitVersion(draftId: string) {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');
    const version = {
      id: Math.random().toString(),
      draftId,
      version: this.versions.length + 1,
      graph: draft.graph,
      committedAt: new Date()
    };
    this.versions.push(version);
    return version;
  }
  async getDeployments() { return this.deployments; }
  async promoteDeployment(name: string, versionId: string) {
    const deployment = {
      id: Math.random().toString(),
      name,
      activeVersionId: versionId,
      deployedAt: new Date()
    };
    this.deployments.push(deployment);
    return deployment;
  }
}
