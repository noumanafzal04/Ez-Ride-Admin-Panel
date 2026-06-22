import axios from 'axios'
import config from '../config'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: config.BASE_URL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

// Attach the bearer token on every request.
api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// On 401, clear auth and bounce to login.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth()
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default api
