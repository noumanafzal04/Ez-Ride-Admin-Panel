import { useState } from 'react'
import {
  Users, BadgeCheck, Car, ClipboardCheck, Wrench, Loader2,
  UserCheck, RefreshCw,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts'
import { useReports } from '../hooks/useReports'
import { useAdminNotifications } from '../hooks/useAdminNotifications'
import useAuthStore from '../store/authStore'
import RangeFilter from '../components/RangeFilter'
import { rangeFromPreset } from '../utils/dateRange'
import { StatCard, StatCards, SoftStat } from '../components/StatCard'

const DASH_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
]
const TREND_SERIES = [
  { key: 'users', name: 'Users', color: '#1d4ed8' },
  { key: 'bookings', name: 'Bookings', color: '#16a34a' },
]

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}
const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const NOTIF_ICON = { driver_pending: UserCheck, inspection_new: ClipboardCheck, provider_new: Wrench }
const timeAgo = (iso) => {
  if (!iso) return ''
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

/* ---- shared bits ---- */

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-lg">
      {label && <p className="mb-1.5 text-xs font-semibold text-gray-500">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color || p.payload?.color || '#07163b' }} />
          <span className="text-gray-500">{p.name}</span>
          <span className="ml-3 font-semibold text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const Card = ({ title, subtitle, children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-4">
      <h2 className="font-semibold text-ink">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
    {children}
  </div>
)

function Donut({ data, unit = '' }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[160px] w-[160px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={total ? data : [{ name: 'None', value: 1, color: '#eef0f3' }]} dataKey="value" nameKey="name"
              innerRadius={56} outerRadius={76} paddingAngle={total ? 3 : 0} stroke="none">
              {(total ? data : [{ color: '#eef0f3' }]).map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            {total > 0 && <Tooltip content={<ChartTip />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-xs text-gray-400">Total{unit}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2.5">
        {data.map((d) => {
          const pct = total ? Math.round((d.value / total) * 100) : 0
          return (
            <div key={d.name} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-gray-600">{d.name}</span>
              <span className="ml-auto font-semibold text-gray-900">{d.value}</span>
              <span className="w-9 text-right text-xs text-gray-400">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [preset, setPreset] = useState('month')
  const [range, setRange] = useState(rangeFromPreset('month'))
  const { data: r, isLoading, refetch, isFetching } = useReports(range)
  const { data: feed } = useAdminNotifications(true)
  const user = useAuthStore((s) => s.user)

  const onPreset = (key) => { setPreset(key); setRange(rangeFromPreset(key)) }
  const onCustom = ([from, to]) => { setPreset('custom'); setRange({ from, to }) }

  if (isLoading || !r) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  const verification = [
    { name: 'Verified', value: r.driver_verification.verified, color: '#10b981' },
    { name: 'Pending', value: r.driver_verification.pending, color: '#f59e0b' },
    { name: 'Rejected', value: r.driver_verification.rejected, color: '#ef4444' },
  ]
  const inspections = [
    { name: 'Pending', value: r.inspections.pending, color: '#3b82f6' },
    { name: 'Scheduled', value: r.inspections.scheduled, color: '#8b5cf6' },
    { name: 'Completed', value: r.inspections.completed, color: '#10b981' },
    { name: 'Cancelled', value: r.inspections.cancelled, color: '#ef4444' },
  ]
  const providers = [
    { name: 'Approved', value: r.providers.approved, color: '#10b981' },
    { name: 'Pending', value: r.providers.pending, color: '#f59e0b' },
    { name: 'Rejected', value: r.providers.rejected, color: '#ef4444' },
  ]

  return (
    <div className="w-full space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-ink to-ink-700 p-6 text-white shadow-sm">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-400/10" />
        <div className="absolute -bottom-14 right-28 h-36 w-36 rounded-full bg-white/5" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-white/60">{greeting()}</p>
            <h1 className="mt-1 text-2xl font-bold">{user?.name || 'Admin'} 👋</h1>
            <p className="mt-1 text-sm text-white/70">Here's what's happening across EZRide.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-xl bg-white/10 px-4 py-2 text-sm text-white/80 md:block">{today}</span>
            <button onClick={() => refetch()} className="flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-brand-300">
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Headline KPIs */}
      <StatCards className="mb-0">
        <StatCard tone="violet" label="Total users" value={r.users.total} icon={Users} />
        <StatCard tone="amber" label="Pending verifications" value={r.driver_verification.pending} icon={BadgeCheck} />
        <StatCard tone="teal" label="Completed rides" value={r.rides.completed} icon={Car} />
        <StatCard tone="blue" label="Inspection requests" value={r.inspections.total} icon={ClipboardCheck} />
      </StatCards>

      {/* Range filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-gray-500">Activity · {r.range.from} → {r.range.to}</p>
        <RangeFilter presets={DASH_PRESETS} active={preset} onPreset={onPreset} onCustom={onCustom} />
      </div>

      {/* Period KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SoftStat tone="blue" label="New users" value={r.period.new_users} icon={Users} />
        <SoftStat tone="teal" label="New rides" value={r.period.new_rides} icon={Car} />
        <SoftStat tone="emerald" label="Bookings" value={r.period.new_bookings} icon={ClipboardCheck} />
      </div>

      {/* Trend + verification donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Activity trend" subtitle="New records over the selected period" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={r.trend} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <defs>
                {TREND_SERIES.map((s) => (
                  <linearGradient key={s.key} id={`d-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f2f5" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 12, fill: '#9aa0a6' }} axisLine={false} tickLine={false} allowDecimals={false} width={34} />
              <Tooltip content={<ChartTip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              {TREND_SERIES.map((s) => (
                <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={`url(#d-${s.key})`} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Driver Verification" subtitle="Status of driver profiles">
          <Donut data={verification} />
        </Card>
      </div>

      {/* Inspections donut + providers donut + recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Inspections" subtitle="By status"><Donut data={inspections} /></Card>
        <Card title="Service Providers" subtitle="By status"><Donut data={providers} /></Card>

        <Card title="Recent activity" subtitle="Latest across the platform">
          <div className="-mx-1 max-h-[210px] space-y-1 overflow-y-auto">
            {(feed?.notifications || []).length === 0 ? (
              <div className="flex h-[180px] items-center justify-center text-sm text-gray-400">No recent activity</div>
            ) : (
              feed.notifications.slice(0, 8).map((n) => {
                const Icon = NOTIF_ICON[n.type] || ClipboardCheck
                return (
                  <div key={n.id} className="flex items-start gap-3 rounded-lg px-1 py-2 transition hover:bg-gray-50">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-ink"><Icon size={15} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      <p className="truncate text-xs text-gray-500">{n.message}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                  </div>
                )
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
