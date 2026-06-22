import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PanelLeft, Search, Bell, ChevronDown, LogOut, User, UserCheck, ClipboardCheck, Wrench, Car } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { useLogout } from '../hooks/useAuth'
import { useAdminUnread, useAdminNotifications, useMarkAdminRead } from '../hooks/useAdminNotifications'

const NOTIF_ICON = { driver_pending: UserCheck, inspection_new: ClipboardCheck, provider_new: Wrench, listing_managed_new: Car }
const NOTIF_ROUTE = { driver_pending: '/users', inspection_new: '/inspections', provider_new: '/providers', listing_managed_new: '/listings' }
const timeAgo = (iso) => {
  if (!iso) return ''
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export default function Topbar({ onToggleSidebar }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const menuRef = useRef(null)
  const bellRef = useRef(null)

  const { data: unread = 0 } = useAdminUnread()
  const { data: feed } = useAdminNotifications(bellOpen)
  const markRead = useMarkAdminRead()

  const openBell = () => {
    setBellOpen((v) => {
      const next = !v
      if (next && unread > 0) markRead.mutate()
      return next
    })
  }

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const name = user?.name || 'Admin'
  const role = user?.role?.name || (user?.is_super ? 'Super Admin' : 'Staff')
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  const doLogout = () => logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) })

  return (
    <header className="relative z-30 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4">
      <button
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={20} />
      </button>

      {/* Search */}
      <div className="relative max-w-xl flex-1">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search users, requests, providers..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-16 text-sm text-gray-700 outline-none transition focus:border-ink focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
        <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400 sm:block">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button onClick={openBell} className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-800">Notifications</div>
              <div className="max-h-96 overflow-y-auto">
                {(feed?.notifications || []).length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">No notifications</p>
                ) : (
                  feed.notifications.map((n) => {
                    const Icon = NOTIF_ICON[n.type] || Bell
                    const to = NOTIF_ROUTE[n.type]
                    const go = () => { if (to) { navigate(to); setBellOpen(false) } }
                    return (
                      <button key={n.id} onClick={go}
                        className={`flex w-full gap-3 border-b border-gray-50 px-4 py-3 text-left transition hover:bg-gray-50 ${n.is_read ? '' : 'bg-brand-50/40'}`}>
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-ink"><Icon size={16} /></span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800">{n.title}</p>
                          <p className="truncate text-xs text-gray-500">{n.message}</p>
                        </div>
                        <span className="shrink-0 text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mx-1 h-6 w-px bg-gray-200" />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-brand-400">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-gray-800">{name}</span>
              <span className="block text-xs leading-tight text-gray-400">{role}</span>
            </span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
              <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <User size={16} /> Profile
              </button>
              <button onClick={doLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
