import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useInspections = (status) =>
  useQuery({
    queryKey: ['admin-inspections', status || 'all'],
    queryFn: () => adminService.inspections({ status: status || undefined }).then((r) => r.data?.data?.requests || []),
  })

export const useInspection = (id) =>
  useQuery({
    queryKey: ['admin-inspection', id],
    queryFn: () => adminService.inspection(id).then((r) => r.data?.data),
    enabled: !!id,
  })

export const useInspectionCategories = () =>
  useQuery({
    queryKey: ['admin-inspection-categories'],
    queryFn: () => adminService.inspectionCategories().then((r) => r.data?.data?.categories || []),
    staleTime: 60 * 60 * 1000,
  })

const invalidate = (qc) => {
  qc.invalidateQueries({ queryKey: ['admin-inspections'] })
  qc.invalidateQueries({ queryKey: ['admin-inspection'] })
}

export const useUpdateInspectionStatus = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => adminService.updateInspectionStatus(id, payload),
    onSuccess: (...a) => { invalidate(qc); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}

export const useSaveInspectionReport = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => adminService.saveInspectionReport(id, payload),
    onSuccess: (...a) => { invalidate(qc); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
