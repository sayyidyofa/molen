import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type MLModel } from '@molen/shared-types';
import { API_BASE } from './common';

export function useModels() {
  return useQuery<MLModel[]>({
    queryKey: ['models'],
    queryFn: () => fetch(`${API_BASE}/models`).then(res => res.json()),
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
