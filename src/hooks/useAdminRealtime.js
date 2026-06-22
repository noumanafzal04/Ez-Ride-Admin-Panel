import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getEcho } from '../services/echo'
import useAuthStore from '../store/authStore'

// Subscribe to the shared admin channel for the whole session. New admin
// notifications bump the bell badge instantly and refresh the feed.
export default function useAdminRealtime() {
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    if (!token) return undefined
    try {
      const channel = getEcho().private('admin')
      channel.listen('.admin.notification', () => {
        qc.setQueryData(['admin-unread'], (n) => (Number(n) || 0) + 1)
        qc.invalidateQueries({ queryKey: ['admin-unread'] })
        qc.invalidateQueries({ queryKey: ['admin-notifications'] })
      })
    } catch {
      /* Reverb unreachable — falls back to the 30s poll */
    }
    return () => { try { getEcho().leave('admin') } catch { /* noop */ } }
  }, [token, qc])
}
