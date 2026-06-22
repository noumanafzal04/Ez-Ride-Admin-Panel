import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useAdminUnread = () =>
  useQuery({
    queryKey: ['admin-unread'],
    queryFn: () => adminService.notificationsUnread().then((r) => r.data?.data?.unread_count || 0),
    refetchInterval: 30000,
  })

export const useAdminNotifications = (enabled) =>
  useQuery({
    queryKey: ['admin-notifications'],
    queryFn: () => adminService.notifications().then((r) => r.data?.data || { notifications: [] }),
    enabled,
  })

export const useMarkAdminRead = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adminService.markNotificationsRead(),
    onSuccess: () => {
      qc.setQueryData(['admin-unread'], 0)
      qc.invalidateQueries({ queryKey: ['admin-notifications'] })
    },
  })
}
