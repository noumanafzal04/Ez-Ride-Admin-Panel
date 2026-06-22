import useAuthStore from '../store/authStore'

// Permission helper. Super Admin bypasses all checks.
export default function usePermissions() {
  const user = useAuthStore((s) => s.user)
  const isSuper = !!user?.is_super
  const perms = user?.permissions || []

  return {
    isSuper,
    permissions: perms,
    can: (key) => !key || isSuper || perms.includes(key),
  }
}
