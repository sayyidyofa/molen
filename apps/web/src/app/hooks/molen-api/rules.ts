import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Rule, type RuleType, type TypedRule } from '@molen/shared-types';
import { API_BASE } from './common';

export function useRules() {
  return useQuery<Rule[]>({
    queryKey: ['rules'],
    queryFn: () => fetch(`${API_BASE}/rules`).then(res => res.json()),
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

// Rule Types
export function useRuleTypes() {
  return useQuery<RuleType[]>({
    queryKey: ['rule-types'],
    queryFn: () => fetch(`${API_BASE}/rule-types`).then(res => res.json()),
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

// Typed Rules
export function useTypedRules() {
  return useQuery<TypedRule[]>({
    queryKey: ['typed-rules'],
    queryFn: () => fetch(`${API_BASE}/typed-rules`).then(res => res.json()),
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
