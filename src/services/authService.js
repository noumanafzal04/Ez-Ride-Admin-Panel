import api from './api'

const authService = {
  login: (payload) => api.post('/admin/auth/login', payload),
  me: () => api.get('/admin/auth/me'),
  logout: () => api.post('/admin/auth/logout'),
}

export default authService
