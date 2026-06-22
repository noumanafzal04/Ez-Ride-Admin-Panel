import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useAppUsers = (filters = {}) =>
  useQuery({
    queryKey: ['app-users', filters],
    queryFn: () => adminService.appUsers(filters).then((r) => r.data?.data || []),
  })

export const useSetVerification = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => adminService.setVerification(id, status),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['app-users'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
