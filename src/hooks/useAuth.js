import { useMutation } from '@tanstack/react-query'
import authService from '../services/authService'
import useAuthStore from '../store/authStore'
import { disconnectEcho } from '../services/echo'

// Login against the admin panel (admin_users via Sanctum).
export const useLogin = (options = {}) => {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: async (payload) => {
      const res = await authService.login(payload)
      const { token, admin } = res.data?.data || {}
      setAuth(token, admin)
      return admin
    },
    ...options,
  })
}

export const useLogout = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  return useMutation({
    mutationFn: () => authService.logout().catch(() => {}),
    onSettled: () => { disconnectEcho(); clearAuth() },
  })
}
