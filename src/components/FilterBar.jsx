import { SlidersHorizontal } from 'lucide-react'

// Polished, consistent filter panel used across admin list pages.
//   <FilterBar title="Users" actions={<Button>Add user</Button>}>
//     <FilterGroup label="Search" className="flex-1 min-w-60"><Input.Search size="large" /></FilterGroup>
//     <FilterGroup label="Status"><Segmented size="large" /></FilterGroup>
//   </FilterBar>
export function FilterBar({ children, title = 'Filters', actions, className = '' }) {
  return (
    <div className={`mb-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {/* Header: title + page actions (Add / Create …) */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <SlidersHorizontal size={15} className="text-gray-400" />
          {title}
        </span>
        {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>

      {/* Controls — wrap neatly into rows, aligned to the bottom of each cell */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3.5 px-4 py-4">
        {children}
      </div>
    </div>
  )
}

export function FilterGroup({ label, children, className = '' }) {
  return (
    <div className={`flex min-w-37.5 flex-col gap-1.5 ${className}`}>
      <span className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <div className="flex w-full items-center *:w-full">{children}</div>
    </div>
  )
}

// Kept for backwards-compat with pages that still import it — no longer renders a divider.
export function FilterDivider() {
  return null
}

export default FilterBar
