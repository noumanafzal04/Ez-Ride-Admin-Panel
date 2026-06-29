import {
  LayoutDashboard, Users, ClipboardCheck, Wrench,
  Tags, BarChart3, UserCog, ShieldCheck, Settings, Car, CreditCard, CarFront, Megaphone,
} from 'lucide-react'

// Admin portal modules. `perm` gates visibility (Super Admin sees all);
// `group` buckets items under a section header in the sidebar.
export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, group: 'Overview' },

  { to: '/users', label: 'Users', icon: Users, perm: 'users.view', group: 'Operations' },
  { to: '/inspections', label: 'Inspections', icon: ClipboardCheck, perm: 'inspections.view', group: 'Operations' },
  { to: '/providers', label: 'Service Providers', icon: Wrench, perm: 'providers.view', group: 'Operations' },
  { to: '/listings', label: 'Car Listings', icon: Car, perm: 'listings.view', group: 'Operations' },
  { to: '/rentals', label: 'Rent a Car', icon: CarFront, perm: 'rentals.view', group: 'Operations' },
  { to: '/categories', label: 'Service Categories', icon: Tags, perm: 'categories.view', group: 'Operations' },

  { to: '/reports', label: 'Reports', icon: BarChart3, perm: 'reports.view', group: 'Insights' },
  { to: '/billing', label: 'Billing & Plans', icon: CreditCard, perm: 'billing.view', group: 'Insights' },

  { to: '/staff', label: 'Staff', icon: UserCog, perm: 'staff.view', group: 'Access' },
  { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, perm: 'roles.view', group: 'Access' },

  { to: '/announcements', label: 'Send Notification', icon: Megaphone, perm: 'settings.view', group: 'System' },
  { to: '/settings', label: 'Module Settings', icon: Settings, perm: 'settings.view', group: 'System' },
]
