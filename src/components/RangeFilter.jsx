import { DatePicker } from 'antd'

const { RangePicker } = DatePicker

// Preset chips + a custom date range. Presentational — parent owns the state.
export default function RangeFilter({ presets, active, onPreset, onCustom, accent = 'bg-ink text-white' }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <button
          key={p.key}
          onClick={() => onPreset(p.key)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${active === p.key ? accent : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          {p.label}
        </button>
      ))}
      <RangePicker
        size="middle"
        allowClear={false}
        className={`rounded-full ${active === 'custom' ? 'ring-2 ring-brand-200' : ''}`}
        onChange={(vals) => {
          if (vals && vals[0] && vals[1]) onCustom([vals[0].format('YYYY-MM-DD'), vals[1].format('YYYY-MM-DD')])
        }}
      />
    </div>
  )
}
