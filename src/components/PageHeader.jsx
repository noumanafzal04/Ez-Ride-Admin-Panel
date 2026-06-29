import { RefreshCw } from 'lucide-react'

// Page title block + right-aligned action cluster (DreamsPOS-style).
//
//   <PageHeader title="Users" subtitle="Manage app users" onRefresh={refetch}
//     actions={<Button type="primary">Add user</Button>} />

export function IconButton({ icon: Icon, onClick, title, spinning = false, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-ink ${className}`}
    >
      <Icon size={17} className={spinning ? 'animate-spin' : ''} />
    </button>
  )
}

export default function PageHeader({ title, subtitle, actions, onRefresh, refreshing = false }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onRefresh && <IconButton icon={RefreshCw} onClick={onRefresh} title="Refresh" spinning={refreshing} />}
        {actions}
      </div>
    </div>
  )
}
