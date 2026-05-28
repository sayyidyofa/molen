import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type FeatureExtractor } from '@molen/shared-types';
import { API_BASE } from './common';

export function useExtractors() {
  return useQuery<FeatureExtractor[]>({
    queryKey: ['extractors'],
    queryFn: () => fetch(`${API_BASE}/extractors`).then(res => res.json()),
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
