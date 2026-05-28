import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type InputSchema } from '@molen/shared-types';
import { API_BASE } from './common';

export function useSchemas() {
  return useQuery<InputSchema[]>({
    queryKey: ['schemas'],
    queryFn: () => fetch(`${API_BASE}/schemas`).then(res => res.json()),
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
