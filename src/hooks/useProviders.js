import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useProviders = (status) =>
  useQuery({
    queryKey: ['admin-providers', status || 'all'],
    queryFn: () => adminService.providers({ status: status || undefined }).then((r) => r.data?.data?.providers || []),
  })

export const useSetProviderStatus = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => adminService.setProviderStatus(id, status),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-providers'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
