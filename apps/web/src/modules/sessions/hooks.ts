import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SessionCreate, SessionStatus, SessionUpdate } from '@proyectodm/shared'
import { isNotFound } from '../../lib/api-client'
import { campaignKeys } from '../campaigns'
import {
  createSession,
  deleteSession,
  getNextSessionNumber,
  getSession,
  listSessions,
  transitionSession,
  updateSession,
  type SessionListParams,
} from './api'

// Query keys: list is scoped by campaign, detail by session id, and the
// next-number preview by campaign, so invalidating one never touches the rest.
export const sessionKeys = {
  list: (campaignId: string, params: SessionListParams) =>
    ['sessions', campaignId, params] as const,
  detail: (id: string) => ['session', id] as const,
  nextNumber: (campaignId: string) => ['session-next-number', campaignId] as const,
}

export function useSessions(campaignId: string, params: SessionListParams) {
  return useQuery({
    queryKey: sessionKeys.list(campaignId, params),
    queryFn: ({ signal }) => listSessions(campaignId, params, signal),
    enabled: campaignId.trim().length > 0,
    placeholderData: keepPreviousData,
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: ({ signal }) => getSession(id, signal),
    enabled: id.trim().length > 0,
    // A missing session is definitive: do not burn the global retry on 404.
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
  })
}

export function useNextSessionNumber(campaignId: string, enabled = true) {
  return useQuery({
    queryKey: sessionKeys.nextNumber(campaignId),
    queryFn: ({ signal }) => getNextSessionNumber(campaignId, signal),
    enabled: enabled && campaignId.trim().length > 0,
  })
}

// Every session mutation can change the campaign detail (sessionCount) and the
// next-number preview, so both are invalidated alongside the session caches.
function useSessionInvalidation(campaignId: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['sessions', campaignId] })
    void queryClient.invalidateQueries({ queryKey: ['session'] })
    void queryClient.invalidateQueries({ queryKey: sessionKeys.nextNumber(campaignId) })
    void queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) })
  }
}

export function useCreateSession(campaignId: string) {
  const invalidate = useSessionInvalidation(campaignId)
  return useMutation({
    mutationFn: (input: SessionCreate) => createSession(campaignId, input),
    onSuccess: invalidate,
  })
}

export function useUpdateSession(campaignId: string) {
  const invalidate = useSessionInvalidation(campaignId)
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SessionUpdate }) =>
      updateSession(id, input),
    onSuccess: invalidate,
  })
}

export function useTransitionSession(campaignId: string) {
  const invalidate = useSessionInvalidation(campaignId)
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SessionStatus }) =>
      transitionSession(id, status),
    onSuccess: invalidate,
  })
}

export function useDeleteSession(campaignId: string) {
  const invalidate = useSessionInvalidation(campaignId)
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: invalidate,
  })
}
