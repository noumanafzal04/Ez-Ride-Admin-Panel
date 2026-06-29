// Small dot + label status pill (DreamsPOS-style).
//   <StatusPill tone="green">Active</StatusPill>
const TONES = {
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red:    'bg-red-50 text-red-600 ring-red-600/20',
  amber:  'bg-amber-50 text-amber-700 ring-amber-600/20',
  blue:   'bg-blue-50 text-blue-700 ring-blue-600/20',
  gray:   'bg-gray-100 text-gray-500 ring-gray-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  cyan:   'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
}
const DOTS = {
  green: 'bg-emerald-500', red: 'bg-red-500', amber: 'bg-amber-500',
  blue: 'bg-blue-500', gray: 'bg-gray-400', violet: 'bg-violet-500', cyan: 'bg-cyan-500',
}

export default function StatusPill({ tone = 'gray', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${TONES[tone] || TONES.gray} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[tone] || DOTS.gray}`} />
      {children}
    </span>
  )
}
