// Clean single-row filter bar (DreamsPOS-style):
//   • left  — the main search (full-flex) via the `search` prop
//   • right — filter controls passed as children (Select dropdowns, etc.)
//
// Primary page actions (Add / export) live in <PageHeader>, not here.
//
//   <FilterBar search={<Input.Search size="large" />}>
//     <FilterGroup><Select placeholder="Type" /></FilterGroup>
//     <FilterGroup><Select placeholder="Status" /></FilterGroup>
//   </FilterBar>
export function FilterBar({ children, search, className = '' }) {
  const hasExtra = !!children && (!Array.isArray(children) || children.some(Boolean))
  return (
    <div className={`mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-3">
        {search && <div className="min-w-60 flex-1 *:w-full">{search}</div>}
        {hasExtra && (
          <div className="flex flex-wrap items-center gap-2.5">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

// Thin wrapper giving each filter control a consistent min-width.
// Pass `label` to prefix a small inline caption; otherwise the control
// (with its own placeholder) stands alone — like the reference.
export function FilterGroup({ label, children, className = '' }) {
  return (
    <div className={`flex min-w-44 items-center gap-2 *:w-full ${className}`}>
      {label && <span className="shrink-0 text-xs font-medium text-gray-400">{label}</span>}
      {children}
    </div>
  )
}

// Backwards-compat — no longer renders anything.
export function FilterDivider() {
  return null
}

export default FilterBar
