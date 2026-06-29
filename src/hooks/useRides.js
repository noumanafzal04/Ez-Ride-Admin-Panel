import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import adminService from '../services/adminService'

// Server-side paginated. Returns { rows, total }.
export const useRides = ({ page = 1, perPage = 15, ...filters } = {}) =>
  useQuery({
    queryKey: ['admin-rides', page, perPage, filters],
    queryFn: () =>
      adminService.rides({ page, per_page: perPage, ...filters }).then((r) => {
        const d = r.data?.data || {}
        return { rows: d.rides || [], total: d.meta?.total || 0 }
      }),
    placeholderData: keepPreviousData,
  })

export const useRideStats = () =>
  useQuery({
    queryKey: ['admin-ride-stats'],
    queryFn: () => adminService.rideStats().then((r) => r.data?.data || {}),
    staleTime: 60_000,
  })

export const useCancelRide = (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminService.cancelRide(id),
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-rides'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}
