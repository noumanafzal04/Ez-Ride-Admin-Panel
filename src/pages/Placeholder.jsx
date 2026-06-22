import { Hammer } from 'lucide-react'

export default function Placeholder({ title }) {
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-1 text-sm text-gray-500">This module will be built next.</p>

      <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <Hammer size={26} />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-gray-800">{title} — coming soon</h2>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          We’re building the admin modules step by step. This section will be available shortly.
        </p>
      </div>
    </div>
  )
}
