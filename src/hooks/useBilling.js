import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import adminService from '../services/adminService'

/* ── Plans ── */
export const useBillingPlans = () =>
  useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => adminService.billingPlans().then((r) => r.data?.data?.plans || []),
  })

export const useSaveBillingPlan = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => (id ? adminService.updateBillingPlan(id, payload) : adminService.createBillingPlan(payload)),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['billing-plans'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}

export const useDeleteBillingPlan = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminService.deleteBillingPlan(id),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['billing-plans'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}

/* ── Module settings ── */
export const useBillingSettings = () =>
  useQuery({
    queryKey: ['billing-settings'],
    queryFn: () => adminService.billingSettings().then((r) => r.data?.data?.settings || []),
  })

export const useUpdateBillingSetting = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ module, payload }) => adminService.updateBillingSetting(module, payload),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['billing-settings'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}

/* ── Subscriptions ── */
export const useBillingSubscriptions = ({ page = 1, perPage = 10, module, status } = {}) =>
  useQuery({
    queryKey: ['billing-subscriptions', page, perPage, module || 'all', status || 'all'],
    queryFn: () =>
      adminService.billingSubscriptions({ page, per_page: perPage, module: module || undefined, status: status || undefined }).then((r) => {
        const d = r.data?.data || {}
        return { rows: d.subscriptions || [], total: d.meta?.total || 0 }
      }),
    placeholderData: keepPreviousData,
  })

export const useGrantSubscription = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminService.grantSubscription(payload),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['billing-subscriptions'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
