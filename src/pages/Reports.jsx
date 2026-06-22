import { useState, useMemo } from 'react'
import {
  Users, Car, ClipboardCheck, Wrench, Loader2, Tag, TrendingUp, CalendarRange, CheckCircle2,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { useReports } from '../hooks/useReports'
import RangeFilter from '../components/RangeFilter'
import { rangeFromPreset } from '../utils/dateRange'

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
]
const SERIES = [
  { key: 'users', name: 'New users', color: '#1d4ed8' },
  { key: 'bookings', name: 'Bookings', color: '#16a34a' },
  { key: 'listings', name: 'Listings', color: '#ea580c' },
]

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-gray-500">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}</span>
          <span className="ml-3 font-semibold text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

const Kpi = ({ icon: Icon, label, value, tint, accent }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
    <div className={`absolute right-0 top-0 h-20 w-20 -translate-y-6 translate-x-6 rounded-full ${accent} opacity-10`} />
    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}><Icon size={22} /></span>
    <p className="mt-4 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
    <p className="mt-0.5 text-sm text-gray-500">{label}</p>
  </div>
)

const Row = ({ label, value, total, color = 'bg-ink' }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="py-2">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-800">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const Card = ({ title, children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white p-5 ${className}`}>
    <h3 className="mb-2 font-semibold text-gray-900">{title}</h3>
    {children}
  </div>
)

export default function Reports() {
  const [preset, setPreset] = useState('30d')
  const [range, setRange] = useState(rangeFromPreset('30d'))
  const { data: r, isLoading, isFetching } = useReports(range)

  const onPreset = (key) => { setPreset(key); setRange(rangeFromPreset(key)) }
  const onCustom = ([from, to]) => { setPreset('custom'); setRange({ from, to }) }

  const totalNew = useMemo(() => {
    if (!r) return 0
    return r.period.new_users + r.period.new_rides + r.period.new_bookings + r.period.new_listings
  }, [r])

  if (isLoading || !r) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
            <CalendarRange size={15} /> {r.range.from} → {r.range.to}
            {isFetching && <Loader2 size={13} className="animate-spin" />}
          </p>
        </div>
        <RangeFilter presets={PRESETS} active={preset} onPreset={onPreset} onCustom={onCustom} />
      </div>

      {/* Period KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="New users" value={r.period.new_users} tint="bg-blue-50 text-blue-600" accent="bg-blue-500" />
        <Kpi icon={Car} label="New rides posted" value={r.period.new_rides} tint="bg-teal-50 text-teal-600" accent="bg-teal-500" />
        <Kpi icon={CheckCircle2} label="Bookings" value={r.period.new_bookings} tint="bg-emerald-50 text-emerald-600" accent="bg-emerald-500" />
        <Kpi icon={Tag} label="New listings" value={r.period.new_listings} tint="bg-orange-50 text-orange-600" accent="bg-orange-500" />
      </div>

      {/* Trend */}
      <Card title="Activity trend">
        <p className="-mt-1 mb-3 text-sm text-gray-500">{totalNew} new records in this period</p>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={r.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              {SERIES.map((s) => (
                <linearGradient key={s.key} id={`g-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f0f2f5" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} minTickGap={20} />
            <YAxis tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} allowDecimals={false} width={34} />
            <Tooltip content={<ChartTip />} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            {SERIES.map((s) => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} fill={`url(#g-${s.key})`} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Secondary period stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi icon={ClipboardCheck} label="Inspections" value={r.period.new_inspections} tint="bg-violet-50 text-violet-600" accent="bg-violet-500" />
        <Kpi icon={Wrench} label="Service requests" value={r.period.new_service_bookings} tint="bg-cyan-50 text-cyan-600" accent="bg-cyan-500" />
        <Kpi icon={Wrench} label="New providers" value={r.period.new_providers} tint="bg-amber-50 text-amber-600" accent="bg-amber-500" />
        <Kpi icon={TrendingUp} label="Completed bookings" value={r.period.completed_bookings} tint="bg-emerald-50 text-emerald-600" accent="bg-emerald-500" />
      </div>

      {/* All-time breakdowns */}
      <h2 className="pt-2 text-lg font-semibold text-gray-900">All-time breakdown</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Users">
          <Row label="Drivers" value={r.users.drivers} total={r.users.total} color="bg-blue-500" />
          <Row label="Riders" value={r.users.riders} total={r.users.total} color="bg-violet-500" />
        </Card>
        <Card title="Driver verification">
          <Row label="Verified" value={r.driver_verification.verified} total={r.users.drivers} color="bg-emerald-500" />
          <Row label="Pending" value={r.driver_verification.pending} total={r.users.drivers} color="bg-amber-500" />
          <Row label="Rejected" value={r.driver_verification.rejected} total={r.users.drivers} color="bg-red-500" />
        </Card>
        <Card title="Rides">
          <Row label="Active" value={r.rides.active} total={r.rides.total} color="bg-teal-500" />
          <Row label="Completed" value={r.rides.completed} total={r.rides.total} color="bg-emerald-500" />
          <Row label="Cancelled" value={r.rides.cancelled} total={r.rides.total} color="bg-red-500" />
        </Card>
        <Card title="Inspections">
          <Row label="Pending" value={r.inspections.pending} total={r.inspections.total} color="bg-blue-500" />
          <Row label="Scheduled" value={r.inspections.scheduled} total={r.inspections.total} color="bg-violet-500" />
          <Row label="Completed" value={r.inspections.completed} total={r.inspections.total} color="bg-emerald-500" />
          <Row label="Cancelled" value={r.inspections.cancelled} total={r.inspections.total} color="bg-red-500" />
        </Card>
        <Card title="Service providers">
          <Row label="Approved" value={r.providers.approved} total={r.providers.total} color="bg-emerald-500" />
          <Row label="Pending" value={r.providers.pending} total={r.providers.total} color="bg-amber-500" />
          <Row label="Rejected" value={r.providers.rejected} total={r.providers.total} color="bg-red-500" />
        </Card>
        <Card title="Car listings">
          <Row label="Active" value={r.listings?.active || 0} total={r.listings?.total || 0} color="bg-emerald-500" />
          <Row label="In review" value={r.listings?.pending || 0} total={r.listings?.total || 0} color="bg-amber-500" />
          <Row label="Sold" value={r.listings?.sold || 0} total={r.listings?.total || 0} color="bg-gray-400" />
        </Card>
      </div>
    </div>
  )
}
