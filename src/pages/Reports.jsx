import { useState, useMemo } from 'react'
import {
  Users, Car, ClipboardCheck, Wrench, Loader2, TrendingUp, CalendarRange, CheckCircle2,
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import { useReports } from '../hooks/useReports'
import RangeFilter from '../components/RangeFilter'
import { rangeFromPreset } from '../utils/dateRange'
import PageHeader from '../components/PageHeader'
import { StatCard, StatCards, SoftStat } from '../components/StatCard'

const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
]
const SERIES = [
  { key: 'users', name: 'New users', color: '#1d4ed8' },
  { key: 'bookings', name: 'Bookings', color: '#16a34a' },
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
  <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
    <h3 className="mb-2 font-semibold text-ink">{title}</h3>
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
    <div className="w-full">
      <PageHeader
        title="Reports"
        subtitle={`${r.range.from} → ${r.range.to}`}
        actions={
          <>
            {isFetching && <Loader2 size={16} className="animate-spin text-gray-400" />}
            <RangeFilter presets={PRESETS} active={preset} onPreset={onPreset} onCustom={onCustom} />
          </>
        }
      />

      {/* Period headline KPIs */}
      <StatCards>
        <StatCard tone="violet" label="New users" value={r.period.new_users} icon={Users} />
        <StatCard tone="teal" label="New rides posted" value={r.period.new_rides} icon={Car} />
        <StatCard tone="emerald" label="Bookings" value={r.period.new_bookings} icon={CheckCircle2} />
      </StatCards>

      {/* Trend */}
      <Card title="Activity trend" className="mb-6">
        <p className="-mt-1 mb-3 flex items-center gap-1.5 text-sm text-gray-500">
          <CalendarRange size={14} /> {totalNew} new records in this period
        </p>
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
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SoftStat tone="violet" label="Inspections" value={r.period.new_inspections} icon={ClipboardCheck} />
        <SoftStat tone="cyan" label="Service requests" value={r.period.new_service_bookings} icon={Wrench} />
        <SoftStat tone="amber" label="New providers" value={r.period.new_providers} icon={Wrench} />
        <SoftStat tone="emerald" label="Completed bookings" value={r.period.completed_bookings} icon={TrendingUp} />
      </div>

      {/* All-time breakdowns */}
      <h2 className="mb-4 pt-2 text-lg font-semibold text-ink">All-time breakdown</h2>
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
      </div>
    </div>
  )
}
