import { NavLink } from 'react-router-dom'
import { Car } from 'lucide-react'
import { NAV_ITEMS } from '../constants/nav'
import usePermissions from '../hooks/usePermissions'
import useAuthStore from '../store/authStore'

const initials = (n) => (n || 'A').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function Sidebar({ collapsed }) {
  const { can } = usePermissions()
  const user = useAuthStore((s) => s.user)
  const items = NAV_ITEMS.filter((i) => can(i.perm))

  // Group items in nav order, keeping group sequence stable.
  const groups = []
  items.forEach((i) => {
    const g = i.group || 'More'
    let bucket = groups.find((x) => x.name === g)
    if (!bucket) { bucket = { name: g, items: [] }; groups.push(bucket) }
    bucket.items.push(i)
  })

  const roleLabel = user?.role?.name || (user?.is_super ? 'Super Admin' : 'Staff')

  return (
    <aside
      className={`flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink shadow-sm">
          <Car size={20} className="text-brand-400" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-ink">
            EZRide <span className="text-brand-600">Admin</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.name} className="mb-5 last:mb-0">
            {!collapsed && (
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group.name}</p>
            )}
            <div className="space-y-1">
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-100! text-ink!'
                        : 'text-gray-500! hover:bg-brand-50 hover:text-ink!'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-ink" />
                      )}
                      <Icon size={19} className={`shrink-0 ${isActive ? 'text-ink' : 'text-gray-400 group-hover:text-ink'}`} />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-100 p-3">
        <div className={`flex items-center gap-3 rounded-xl bg-gray-50 ${collapsed ? 'justify-center p-2' : 'p-3'}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-brand-400">
            {initials(user?.name)}
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user?.name || 'Admin'}</p>
              <p className="truncate text-xs text-gray-400">{roleLabel}</p>
            </div>
          )}
        </div>
        {!collapsed && <p className="mt-2 px-1 text-[11px] text-gray-300">EZRide Admin · v1.0</p>}
      </div>
    </aside>
  )
}
