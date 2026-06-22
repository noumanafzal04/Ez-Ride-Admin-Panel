import { useQuery } from '@tanstack/react-query'
import adminService from '../services/adminService'

// range = { from, to } (YYYY-MM-DD) — omit for the default 30-day window.
export const useReports = (range = {}) =>
  useQuery({
    queryKey: ['admin-reports', range.from || 'def', range.to || 'def'],
    queryFn: () =>
      adminService
        .reports({ from: range.from || undefined, to: range.to || undefined })
        .then((r) => r.data?.data),
    staleTime: 60 * 1000,
  })
