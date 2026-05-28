import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type Draft, type CommittedVersion } from '@molen/shared-types';
import { API_BASE } from './common';

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

export function useSaveDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: Partial<Draft>) => 
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
      fetch(`${API_BASE}/orchestrators/versions/${draftId}`, { method: 'POST' }).then(res => res.json()),
    onSuccess: (_, draftId) => {
      queryClient.invalidateQueries({ queryKey: ['committed_versions', draftId] });
      queryClient.invalidateQueries({ queryKey: ['orchestrators'] });
    },
  });
}

export function usePromoteDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deployment: { name: string, versionId: string }) => 
      fetch(`${API_BASE}/orchestrators/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deployment),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orchestrators'] });
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
