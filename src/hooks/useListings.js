import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminService from '../services/adminService'

export const useListings = (status, type) =>
  useQuery({
    queryKey: ['admin-listings', status || 'all', type || 'all'],
    queryFn: () =>
      adminService
        .listings({ status: status || undefined, type: type || undefined })
        .then((r) => r.data?.data?.listings || []),
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
