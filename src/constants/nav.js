import {
  LayoutDashboard, Users, ClipboardCheck, Wrench,
  Tags, BarChart3, UserCog, ShieldCheck, Settings, Car,
} from 'lucide-react'

// Admin portal modules. `perm` gates visibility (Super Admin sees all).
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/users', label: 'Users', icon: Users, perm: 'users.view' },
  { to: '/inspections', label: 'Inspections', icon: ClipboardCheck, perm: 'inspections.view' },
  { to: '/providers', label: 'Service Providers', icon: Wrench, perm: 'providers.view' },
  { to: '/listings', label: 'Car Listings', icon: Car, perm: 'listings.view' },
  { to: '/categories', label: 'Service Categories', icon: Tags, perm: 'categories.view' },
  { to: '/reports', label: 'Reports', icon: BarChart3, perm: 'reports.view' },
  { to: '/staff', label: 'Staff', icon: UserCog, perm: 'staff.view' },
  { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'roles.view' },
  { to: '/settings', label: 'Settings', icon: Settings, perm: 'settings.view' },
]
