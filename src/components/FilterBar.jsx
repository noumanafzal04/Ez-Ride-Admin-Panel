// Polished, consistent filter toolbar used across admin list pages.
// Usage:
//   <FilterBar>
//     <FilterGroup label="Search"> <Input.Search size="large" /> </FilterGroup>
//     <FilterDivider />
//     <FilterGroup label="Status"> <Segmented size="large" /> </FilterGroup>
//   </FilterBar>

export function FilterBar({ children, className = '' }) {
  return (
    <div className={`mb-5 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function FilterGroup({ label, children, className = '' }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="px-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <div className="flex items-center">{children}</div>
    </div>
  )
}

export function FilterDivider() {
  return <div className="hidden h-10 w-px self-end bg-gray-200 sm:block" />
}

export default FilterBar
