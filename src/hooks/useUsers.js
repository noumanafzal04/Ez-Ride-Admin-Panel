import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import adminService from '../services/adminService'

// Server-side paginated. Returns { rows, total }.
export const useAppUsers = ({ page = 1, perPage = 10, ...filters } = {}) =>
  useQuery({
    queryKey: ['app-users', page, perPage, filters],
    queryFn: () =>
      adminService.appUsers({ page, per_page: perPage, ...filters }).then((r) => {
        const d = r.data?.data || {}
        return { rows: d.users || [], total: d.meta?.total || 0 }
      }),
    placeholderData: keepPreviousData,
  })

export const useSetVerification = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }) => adminService.setVerification(id, status),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['app-users'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
