import { NavLink } from 'react-router-dom'
import { Car } from 'lucide-react'
import { NAV_ITEMS } from '../constants/nav'
import usePermissions from '../hooks/usePermissions'

export default function Sidebar({ collapsed }) {
  const { can } = usePermissions()
  const items = NAV_ITEMS.filter((i) => can(i.perm))

  return (
    <aside
      className={`flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-100 px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink">
          <Car size={20} className="text-brand-400" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-ink">
            EZRide <span className="text-brand-600">Admin</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-ink text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon size={19} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-xs text-gray-400">EZRide Admin · v1.0</p>
        </div>
      )}
    </aside>
  )
}
