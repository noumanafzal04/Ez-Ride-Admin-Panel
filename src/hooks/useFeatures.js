import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useFeatureOrders = ({ page = 1, perPage = 20, ...filters } = {}) =>
  useQuery({
    queryKey: ['feature-orders', page, perPage, filters],
    queryFn: () =>
      adminService.featureOrders({ page, per_page: perPage, ...filters }).then((r) => {
        const d = r.data?.data || {}
        return { rows: d.orders || [], total: d.meta?.total || 0 }
      }),
    placeholderData: keepPreviousData,
  })

export const useFeatureSettings = () =>
  useQuery({
    queryKey: ['feature-settings'],
    queryFn: () => adminService.featureSettings().then((r) => r.data?.data?.settings || []),
    staleTime: 60_000,
  })

export const useUpdateFeatureSetting = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ module, payload }) => adminService.updateFeatureSetting(module, payload),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['feature-settings'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
