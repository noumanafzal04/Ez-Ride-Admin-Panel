import { useState } from 'react'
import { Table } from 'antd'
import { BadgeCheck, XCircle, PauseCircle, Loader2 } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import { useProviders, useSetProviderStatus } from '../hooks/useProviders'

const FILTERS = [
  { key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' }, { key: 'suspended', label: 'Suspended' },
]
const STATUS_STYLE = {
  approved: 'bg-emerald-50 text-emerald-600', pending: 'bg-amber-50 text-amber-600',
  rejected: 'bg-red-50 text-red-600', suspended: 'bg-gray-100 text-gray-500',
}
const initials = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function Providers() {
  const { can } = usePermissions()
  const [status, setStatus] = useState('')
  const { data: providers = [], isLoading } = useProviders(status)
  const setStatusMut = useSetProviderStatus({ onError: (e) => alert(e.response?.data?.message || 'Failed.') })
  const canManage = can('providers.update')

  const columns = [
    {
      title: 'Provider', dataIndex: 'business_name',
      render: (_, p) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-brand-400">{initials(p.business_name)}</span>
          <div>
            <p className="font-medium text-gray-800">{p.business_name}</p>
            <p className="text-xs text-gray-400">{p.phone || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Categories',
      render: (_, p) => (
        <div className="flex flex-wrap gap-1.5">
          {(p.categories || []).slice(0, 3).map((c) => <span key={c.id} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{c.name}</span>)}
        </div>
      ),
    },
    { title: 'City', width: 120, render: (_, p) => <span className="text-gray-600">{p.city?.name || '—'}</span> },
    {
      title: 'Status', dataIndex: 'status', width: 120,
      render: (s) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[s] || 'bg-gray-100 text-gray-500'}`}>{s}</span>,
    },
    {
      title: 'Actions', align: 'right', width: 260,
      render: (_, p) => {
        if (!canManage) return null
        const busy = setStatusMut.isPending && setStatusMut.variables?.id === p.id
        return (
          <div className="flex justify-end gap-2">
            {p.status !== 'approved' && (
              <button disabled={busy} onClick={() => setStatusMut.mutate({ id: p.id, status: 'approved' })}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />} Approve
              </button>
            )}
            {p.status === 'approved' && (
              <button disabled={busy} onClick={() => setStatusMut.mutate({ id: p.id, status: 'suspended' })}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                <PauseCircle size={15} /> Suspend
              </button>
            )}
            {p.status !== 'rejected' && (
              <button disabled={busy} onClick={() => setStatusMut.mutate({ id: p.id, status: 'rejected' })}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                <XCircle size={15} /> Reject
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Service Providers</h1>
        <p className="mt-1 text-sm text-gray-500">Review and verify car-service providers.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setStatus(f.key)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${status === f.key ? 'bg-ink text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f.label}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-2">
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={providers}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} providers` }}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  )
}
