import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useProviders = ({ page = 1, perPage = 10, status } = {}) =>
  useQuery({
    queryKey: ['admin-providers', page, perPage, status || 'all'],
    queryFn: () =>
      adminService.providers({ page, per_page: perPage, status: status || undefined }).then((r) => {
        const d = r.data?.data || {}
        return { rows: d.providers || [], total: d.meta?.total || 0 }
      }),
    placeholderData: keepPreviousData,
  })

export const useCreateProvider = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminService.createProvider(payload),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-providers'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}

export const useSetProviderStatus = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => adminService.setProviderStatus(id, status),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-providers'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
