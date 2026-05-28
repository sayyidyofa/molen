import { useQuery } from '@tanstack/react-query';
import { API_BASE } from './common';
import { useSchemas } from './schemas';
import { useExtractors } from './extractors';
import { useRules, useRuleTypes, useTypedRules } from './rules';
import { useModels } from './models';
import { useDrafts } from './orchestrators';

export function useCombinedAppState() {
  const schemas = useSchemas();
  const extractors = useExtractors();
  const rules = useRules();
  const models = useModels();
  const ruleTypes = useRuleTypes();
  const typedRules = useTypedRules();
  const drafts = useDrafts();
  
  const systemHealth = useQuery({ 
    queryKey: ['system-health'], 
    queryFn: () => fetch(`${API_BASE}/system-health`).then(res => res.json()) 
  });
  
  const metrics = useQuery({ 
    queryKey: ['metrics'], 
    queryFn: () => fetch(`${API_BASE}/metrics`).then(res => res.json()) 
  });

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
    isLoading: 
      schemas.isLoading || 
      extractors.isLoading || 
      rules.isLoading || 
      models.isLoading || 
      ruleTypes.isLoading || 
      typedRules.isLoading || 
      drafts.isLoading || 
      systemHealth.isLoading || 
      metrics.isLoading,
  };
}
