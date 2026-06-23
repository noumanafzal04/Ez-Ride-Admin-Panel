import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useListings = ({ page = 1, perPage = 10, status, type } = {}) =>
  useQuery({
    queryKey: ['admin-listings', page, perPage, status || 'all', type || 'all'],
    queryFn: () =>
      adminService
        .listings({ page, per_page: perPage, status: status || undefined, type: type || undefined })
        .then((r) => {
          const d = r.data?.data || {}
          return { rows: d.listings || [], total: d.meta?.total || 0 }
        }),
    placeholderData: keepPreviousData,
  })

const mutation = (fn) => {
  const useIt = (options = {}) => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: fn,
      onSuccess: (...a) => { qc.invalidateQueries({ queryKey: ['admin-listings'] }); options.onSuccess?.(...a) },
      onError: options.onError,
    })
  }
  return useIt
}

export const useSetListingStatus = mutation(({ id, status }) => adminService.setListingStatus(id, status))
export const useSetListingPrice = mutation(({ id, price }) => adminService.setListingPrice(id, price))
export const useSetListingFeatured = mutation(({ id, is_featured }) => adminService.setListingFeatured(id, is_featured))
