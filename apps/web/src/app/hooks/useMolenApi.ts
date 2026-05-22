import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  InputSchema, 
  FeatureExtractor, 
  Rule, 
  MLModel, 
  RuleType, 
  TypedRule, 
  Draft, 
  CommittedVersion 
} from '@molen/shared-types';

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : '');

export function useSchemas() {
  return useQuery<InputSchema[]>({
    queryKey: ['schemas'],
    queryFn: () => fetch(`${API_BASE}/schemas`).then(res => res.json()),
  });
}

export function useExtractors() {
  return useQuery<FeatureExtractor[]>({
    queryKey: ['extractors'],
    queryFn: () => fetch(`${API_BASE}/extractors`).then(res => res.json()),
  });
}

export function useRules() {
  return useQuery<Rule[]>({
    queryKey: ['rules'],
    queryFn: () => fetch(`${API_BASE}/rules`).then(res => res.json()),
  });
}

export function useModels() {
  return useQuery<MLModel[]>({
    queryKey: ['models'],
    queryFn: () => fetch(`${API_BASE}/models`).then(res => res.json()),
  });
}

export function useRuleTypes() {
  return useQuery<RuleType[]>({
    queryKey: ['rule-types'],
    queryFn: () => fetch(`${API_BASE}/rule-types`).then(res => res.json()),
  });
}

export function useTypedRules() {
  return useQuery<TypedRule[]>({
    queryKey: ['typed-rules'],
    queryFn: () => fetch(`${API_BASE}/typed-rules`).then(res => res.json()),
  });
}

export function useDrafts() {
  return useQuery<Draft[]>({
    queryKey: ['drafts'],
    queryFn: () => fetch(`${API_BASE}/orchestrators/drafts`).then(res => res.json()),
  });
}

export function useDraft(id: string) {
  return useQuery<Draft>({
    queryKey: ['draft', id],
    queryFn: () => fetch(`${API_BASE}/orchestrators/drafts/${id}`).then(res => res.json()),
  });
}

export function useCommittedVersions(draftId: string) {
  return useQuery<CommittedVersion[]>({
    queryKey: ['committed_versions', draftId],
    queryFn: () => fetch(`${API_BASE}/orchestrators/versions/${draftId}`).then(res => res.json()),
    enabled: !!draftId,
  });
}

export function useAddSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schema: Omit<InputSchema, 'id'>) => 
      fetch(`${API_BASE}/schemas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
    },
  });
}

export function useUpdateSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, schema }: { id: string, schema: Partial<InputSchema> }) => 
      fetch(`${API_BASE}/schemas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
    },
  });
}

export function useAddExtractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (extractor: Omit<FeatureExtractor, 'id'>) => 
      fetch(`${API_BASE}/extractors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractor),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extractors'] });
    },
  });
}

export function useUpdateExtractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, extractor }: { id: string, extractor: Partial<FeatureExtractor> }) => 
      fetch(`${API_BASE}/extractors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractor),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extractors'] });
    },
  });
}

export function useAddRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: Omit<Rule, 'id'>) => 
      fetch(`${API_BASE}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useUpdateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rule }: { id: string, rule: Partial<Rule> }) => 
      fetch(`${API_BASE}/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useAddModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (model: Omit<MLModel, 'id'>) => 
      fetch(`${API_BASE}/models`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
}

export function useUpdateModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, model }: { id: string, model: Partial<MLModel> }) => 
      fetch(`${API_BASE}/models/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(model),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
}

export function useAddRuleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleType: Omit<RuleType, 'id'>) => 
      fetch(`${API_BASE}/rule-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleType),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rule-types'] });
    },
  });
}

export function useUpdateRuleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ruleType }: { id: string, ruleType: Partial<RuleType> }) => 
      fetch(`${API_BASE}/rule-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleType),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rule-types'] });
    },
  });
}

export function useAddTypedRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (typedRule: Omit<TypedRule, 'id'>) => 
      fetch(`${API_BASE}/typed-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typedRule),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typed-rules'] });
    },
  });
}

export function useUpdateTypedRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, typedRule }: { id: string, typedRule: Partial<TypedRule> }) => 
      fetch(`${API_BASE}/typed-rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typedRule),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typed-rules'] });
    },
  });
}

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: Draft | Omit<Draft, 'id'>) => 
      fetch(`${API_BASE}/orchestrators/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
}

export function useCommitVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draftId: string) => 
      fetch(`${API_BASE}/orchestrators/commit/${draftId}`, {
        method: 'POST',
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committed_versions'] });
    },
  });
}

export function usePromoteDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deployment: { name: string, versionId: string }) => 
      fetch(`${API_BASE}/deployments/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployment),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetch(`${API_BASE}/orchestrators/drafts/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });
}

export function useDeleteSchema() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetch(`${API_BASE}/schemas/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
    },
  });
}

export function useDeleteExtractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetch(`${API_BASE}/extractors/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extractors'] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetch(`${API_BASE}/rules/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useDeleteModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetch(`${API_BASE}/models/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });
}

export function useDeleteRuleType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetch(`${API_BASE}/rule-types/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rule-types'] });
    },
  });
}

export function useDeleteTypedRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => 
      fetch(`${API_BASE}/typed-rules/${id}`, { method: 'DELETE' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['typed-rules'] });
    },
  });
}

export function useCombinedAppState() {
  const schemas = useSchemas();
  const extractors = useExtractors();
  const rules = useRules();
  const models = useModels();
  const ruleTypes = useRuleTypes();
  const typedRules = useTypedRules();
  const drafts = useDrafts();
  const systemHealth = useQuery({ queryKey: ['system-health'], queryFn: () => fetch(`${API_BASE}/system-health`).then(res => res.json()) });
  const metrics = useQuery({ queryKey: ['metrics'], queryFn: () => fetch(`${API_BASE}/metrics`).then(res => res.json()) });

  return {
    inputSchemas: schemas.data || [],
    featureExtractors: extractors.data || [],
    rules: rules.data || [],
    models: models.data || [],
    ruleTypes: ruleTypes.data || [],
    typedRules: typedRules.data || [],
    orchestrators: drafts.data || [],
    systemHealth: systemHealth.data || [],
    metrics: metrics.data || {},
    isLoading: schemas.isLoading || extractors.isLoading || rules.isLoading || models.isLoading || ruleTypes.isLoading || typedRules.isLoading || drafts.isLoading || systemHealth.isLoading || metrics.isLoading,
  };
}
