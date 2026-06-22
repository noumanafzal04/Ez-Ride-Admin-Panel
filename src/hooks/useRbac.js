import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const usePermissionsCatalog = () =>
  useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => adminService.permissions().then((r) => r.data?.data || []),
    staleTime: 60 * 60 * 1000,
  })

export const useRoles = () =>
  useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminService.roles().then((r) => r.data?.data || []),
  })

export const useRole = (id) =>
  useQuery({
    queryKey: ['admin-role', id],
    queryFn: () => adminService.role(id).then((r) => r.data?.data),
    enabled: !!id,
  })

export const useStaff = () =>
  useQuery({
    queryKey: ['admin-staff'],
    queryFn: () => adminService.staff().then((r) => r.data?.data || []),
  })

export const useSaveRole = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? adminService.updateRole(id, payload) : adminService.createRole(payload),
    onSuccess: (...a) => {
      qc.invalidateQueries({ queryKey: ['admin-roles'] })
      options.onSuccess?.(...a)
    },
    onError: options.onError,
  })
}

export const useDeleteRole = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminService.deleteRole(id),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-roles'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}

export const useSaveStaff = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) =>
      id ? adminService.updateStaff(id, payload) : adminService.createStaff(payload),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-staff'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}

export const useDeleteStaff = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminService.deleteStaff(id),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-staff'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
