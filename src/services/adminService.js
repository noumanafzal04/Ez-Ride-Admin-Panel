import api from './api'

const adminService = {
  // RBAC
  permissions: () => api.get('/admin/permissions'),
  roles: () => api.get('/admin/roles'),
  role: (id) => api.get(`/admin/roles/${id}`),
  createRole: (payload) => api.post('/admin/roles', payload),
  updateRole: (id, payload) => api.put(`/admin/roles/${id}`, payload),
  deleteRole: (id) => api.delete(`/admin/roles/${id}`),

  // Featured (paid boost)
  featureOrders: (params) => api.get('/admin/feature-orders', { params }),
  featureSettings: () => api.get('/admin/feature-settings'),
  updateFeatureSetting: (module, payload) => api.put(`/admin/feature-settings/${module}`, payload),

  // App users + verification
  appUsers: (params) => api.get('/admin/app-users', { params }),
  appUserStats: () => api.get('/admin/app-users/stats'),
  appUser: (id) => api.get(`/admin/app-users/${id}`),
  createAppUser: (payload) => api.post('/admin/app-users', payload),
  setVerification: (id, status) => api.post(`/admin/app-users/${id}/verification`, { status }),

  // Rides management
  rides: (params) => api.get('/admin/rides', { params }),
  rideStats: () => api.get('/admin/rides/stats'),
  cancelRide: (id) => api.post(`/admin/rides/${id}/cancel`),

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
  createProvider: (payload) => api.post('/admin/service-providers', payload),
  setProviderStatus: (id, status) => api.post(`/admin/service-providers/${id}/status`, { status }),

  // Service categories
  serviceCategories: () => api.get('/admin/service-categories'),
  createCategory: (payload) => api.post('/admin/service-categories', payload),
  updateCategory: (id, payload) => api.put(`/admin/service-categories/${id}`, payload),
  deleteCategory: (id) => api.delete(`/admin/service-categories/${id}`),

  // Module on/off settings (which app features are live)
  modules: () => api.get('/admin/modules'),
  setModule: (key, enabled) => api.put(`/admin/modules/${key}`, { enabled }),

  // Broadcast a push/notification to an audience
  broadcastNotification: (payload) => api.post('/admin/notifications/broadcast', payload),
  cities: () => api.get('/admin/cities'),

  // Staff
  staff: () => api.get('/admin/staff'),
  createStaff: (payload) => api.post('/admin/staff', payload),
  updateStaff: (id, payload) => api.put(`/admin/staff/${id}`, payload),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),

  // Billing — plans, settings, subscriptions
  billingPlans: () => api.get('/admin/billing/plans'),
  createBillingPlan: (p) => api.post('/admin/billing/plans', p),
  updateBillingPlan: (id, p) => api.put(`/admin/billing/plans/${id}`, p),
  deleteBillingPlan: (id) => api.delete(`/admin/billing/plans/${id}`),
  billingSettings: () => api.get('/admin/billing/settings'),
  updateBillingSetting: (module, p) => api.put(`/admin/billing/settings/${module}`, p),
  billingSubscriptions: (params) => api.get('/admin/billing/subscriptions', { params }),
  grantSubscription: (p) => api.post('/admin/billing/subscriptions/grant', p),

  // Rent a Car
  rentals: (params) => api.get('/admin/rentals', { params }),
  setRentalStatus: (id, status) => api.post(`/admin/rentals/${id}/status`, { status }),
  setRentalPrice: (id, price) => api.post(`/admin/rentals/${id}/price`, { price }),
  setRentalFeatured: (id, is_featured) => api.post(`/admin/rentals/${id}/featured`, { is_featured }),

  // Marketplace car listings
  listings: (params) => api.get('/admin/car-listings', { params }),
  listing: (id) => api.get(`/admin/car-listings/${id}`),
  setListingStatus: (id, status) => api.post(`/admin/car-listings/${id}/status`, { status }),
  setListingPrice: (id, price) => api.post(`/admin/car-listings/${id}/price`, { price }),
  setListingFeatured: (id, is_featured) => api.post(`/admin/car-listings/${id}/featured`, { is_featured }),
}

export default adminService
