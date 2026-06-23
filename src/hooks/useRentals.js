import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useRentals = ({ page = 1, perPage = 10, status, type } = {}) =>
  useQuery({
    queryKey: ['admin-rentals', page, perPage, status || 'all', type || 'all'],
    queryFn: () =>
      adminService.rentals({ page, per_page: perPage, status: status || undefined, type: type || undefined }).then((r) => {
        const d = r.data?.data || {}
        return { rows: d.rentals || [], total: d.meta?.total || 0 }
      }),
    placeholderData: keepPreviousData,
  })

const mutation = (fn) => (options = {}) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-rentals'] }); options.onSuccess?.(...a) },
    onError: options.onError,
  })
}

export const useSetRentalStatus = mutation(({ id, status }) => adminService.setRentalStatus(id, status))
export const useSetRentalPrice = mutation(({ id, price }) => adminService.setRentalPrice(id, price))
export const useSetRentalFeatured = mutation(({ id, is_featured }) => adminService.setRentalFeatured(id, is_featured))
