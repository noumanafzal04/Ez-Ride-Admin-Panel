import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useServiceCategories = () =>
  useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminService.serviceCategories().then((r) => r.data?.data || []),
  })

export const useSaveCategory = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? adminService.updateCategory(id, payload) : adminService.createCategory(payload),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}

export const useDeleteCategory = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminService.deleteCategory(id),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
