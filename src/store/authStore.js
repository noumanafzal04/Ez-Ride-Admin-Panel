import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Auth state (token + admin user), persisted to localStorage — mirrors the
// mobile app's authStore/userStore pattern.
const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: 'ezride-admin-auth' },
  ),
)

export default useAuthStore
