// Gradient summary cards (DreamsPOS-style). Drop a row of these above a table.
//
//   <StatCards>
//     <StatCard tone="violet" label="Total users" value={1007} icon={Users} />
//     <StatCard tone="teal"   label="Drivers"     value={320}  icon={Car} />
//   </StatCards>

const TONES = {
  violet: 'from-violet-500 to-violet-600',
  teal:   'from-teal-500 to-teal-600',
  ink:    'from-ink to-[#0a1f52]',
  blue:   'from-blue-500 to-blue-600',
  amber:  'from-amber-400 to-amber-500',
  rose:   'from-rose-500 to-rose-600',
  emerald:'from-emerald-500 to-emerald-600',
  slate:  'from-slate-600 to-slate-700',
}

export function StatCard({ tone = 'ink', label, value, icon: Icon, loading = false }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${TONES[tone] || TONES.ink} p-5 text-white shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">{label}</p>
          <p className="mt-2 text-3xl font-bold leading-none tracking-tight">
            {loading ? '—' : (value ?? 0).toLocaleString('en-US')}
          </p>
        </div>
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <Icon size={22} className="text-white" />
          </span>
        )}
      </div>
    </div>
  )
}

// Soft white KPI card — colored icon chip + value, for secondary metrics.
//   <SoftStat tone="blue" label="New users" value={42} icon={Users} />
const SOFT_TONES = {
  blue:    'bg-blue-50 text-blue-600',
  teal:    'bg-teal-50 text-teal-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  violet:  'bg-violet-50 text-violet-600',
  amber:   'bg-amber-50 text-amber-600',
  orange:  'bg-orange-50 text-orange-600',
  cyan:    'bg-cyan-50 text-cyan-600',
  rose:    'bg-rose-50 text-rose-600',
}
export function SoftStat({ tone = 'blue', label, value, icon: Icon }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${SOFT_TONES[tone] || SOFT_TONES.blue}`}>
        {Icon && <Icon size={22} />}
      </span>
      <p className="mt-4 text-3xl font-bold tracking-tight text-ink">{(value ?? 0).toLocaleString('en-US')}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
    </div>
  )
}

export function StatCards({ children, className = '' }) {
  return (
    <div className={`mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {children}
    </div>
  )
}

export default StatCard
