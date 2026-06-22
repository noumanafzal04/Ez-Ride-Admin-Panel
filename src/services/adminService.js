import api from './api'

const adminService = {
  // RBAC
  permissions: () => api.get('/admin/permissions'),
  roles: () => api.get('/admin/roles'),
  role: (id) => api.get(`/admin/roles/${id}`),
  createRole: (payload) => api.post('/admin/roles', payload),
  updateRole: (id, payload) => api.put(`/admin/roles/${id}`, payload),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`),

  // App users + verification
  appUsers: (params) => api.get('/admin/app-users', { params }),
  appUser: (id) => api.get(`/admin/app-users/${id}`),
  setVerification: (id, status) => api.post(`/admin/app-users/${id}/verification`, { status }),

  // Reports
  reports: (params) => api.get('/admin/reports/summary', { params }),

  // Admin notifications
  notifications: () => api.get('/admin/notifications'),
  notificationsUnread: () => api.get('/admin/notifications/unread-count'),
  markNotificationsRead: () => api.post('/admin/notifications/read'),

  // Inspections
  inspections: (params) => api.get('/admin/inspection-requests', { params }),
  inspection: (id) => api.get(`/admin/inspection-requests/${id}`),
  inspectionCategories: () => api.get('/admin/inspection-categories'),
  updateInspectionStatus: (id, payload) => api.post(`/admin/inspection-requests/${id}/status`, payload),
  saveInspectionReport: (id, payload) => api.post(`/admin/inspection-requests/${id}/report`, payload),

  // Service providers
  providers: (params) => api.get('/admin/service-providers', { params }),
  setProviderStatus: (id, status) => api.post(`/admin/service-providers/${id}/status`, { status }),

  // Service categories
  serviceCategories: () => api.get('/admin/service-categories'),
  createCategory: (payload) => api.post('/admin/service-categories', payload),
  updateCategory: (id, payload) => api.put(`/admin/service-categories/${id}`, payload),
  deleteCategory: (id) => api.delete(`/admin/service-categories/${id}`),

  // Staff
  staff: () => api.get('/admin/staff'),
  createStaff: (payload) => api.post('/admin/staff', payload),
  updateStaff: (id, payload) => api.put(`/admin/staff/${id}`, payload),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),

  // Marketplace car listings
  listings: (params) => api.get('/admin/car-listings', { params }),
  listing: (id) => api.get(`/admin/car-listings/${id}`),
  setListingStatus: (id, status) => api.post(`/admin/car-listings/${id}/status`, { status }),
  setListingPrice: (id, price) => api.post(`/admin/car-listings/${id}/price`, { price }),
  setListingFeatured: (id, is_featured) => api.post(`/admin/car-listings/${id}/featured`, { is_featured }),
}

export default adminService
