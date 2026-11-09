import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import type { CampaignCreate, CampaignUpdate } from '@proyectodm/shared'
import { isNotFound } from '../../lib/api-client'
import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  updateCampaign,
  type CampaignListParams,
} from './api'

// Query keys: list lives under ['campaigns', ...] and the detail under
// ['campaign', id] so invalidating one prefix never touches the other.
export const campaignKeys = {
  list: (params: CampaignListParams) => ['campaigns', params] as const,
  detail: (id: string) => ['campaign', id] as const,
}

export function useCampaigns(params: CampaignListParams) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: ({ signal }) => listCampaigns(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: ({ signal }) => getCampaign(id, signal),
    enabled: id.trim().length > 0,
    // A missing campaign is definitive: do not burn the global retry on 404.
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CampaignCreate) => createCampaign(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['campaign'] })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CampaignUpdate }) => updateCampaign(id, input),
    onSuccess: (_campaign, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void queryClient.invalidateQueries({ queryKey: campaignKeys.detail(variables.id) })
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      void navigate('/campaigns')
    },
  })
}
