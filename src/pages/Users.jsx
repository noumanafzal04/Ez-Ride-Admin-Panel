import { useState } from 'react'
import { Table } from 'antd'
import { Search, BadgeCheck, XCircle, Loader2 } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import { useAppUsers, useSetVerification } from '../hooks/useUsers'

const TYPE_FILTERS = [
  { key: '', label: 'All' }, { key: 'driver', label: 'Drivers' }, { key: 'user', label: 'Riders' },
]
const VERIF_FILTERS = [
  { key: '', label: 'All' }, { key: 'pending', label: 'Pending' }, { key: 'verified', label: 'Verified' }, { key: 'rejected', label: 'Rejected' },
]
const VERIF_STYLE = { verified: 'bg-emerald-50 text-emerald-600', pending: 'bg-amber-50 text-amber-600', rejected: 'bg-red-50 text-red-600' }
const initials = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default function Users() {
  const { can } = usePermissions()
  const [type, setType] = useState('')
  const [verification, setVerification] = useState('')
  const [search, setSearch] = useState('')

  const filters = {}
  if (type) filters.user_type = type
  if (verification) filters.verification = verification
  if (search.trim()) filters.search = search.trim()

  const { data: users = [], isLoading } = useAppUsers(filters)
  const setVerif = useSetVerification({ onError: (e) => alert(e.response?.data?.message || 'Failed.') })
  const canVerify = can('users.update')

  const columns = [
    {
      title: 'User', dataIndex: 'name',
      render: (_, u) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-brand-400">{initials(u.name)}</span>
          <div>
            <p className="font-medium text-gray-800">{u.name || '—'}</p>
            <p className="text-xs text-gray-400">{u.email} · {u.phone || 'no phone'}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Type', dataIndex: 'user_type', width: 110,
      render: (t) => <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{t === 'driver' ? 'Driver' : 'Rider'}</span>,
    },
    {
      title: 'Verification', width: 130,
      render: (_, u) => {
        const vs = u.driver_profile?.verification_status
        return u.user_type === 'driver' && vs
          ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${VERIF_STYLE[vs] || 'bg-gray-100 text-gray-500'}`}>{vs}</span>
          : <span className="text-gray-300">—</span>
      },
    },
    { title: 'Joined', dataIndex: 'created_at', width: 130, render: fmt },
    {
      title: 'Actions', align: 'right', width: 220,
      render: (_, u) => {
        if (u.user_type !== 'driver' || !canVerify) return null
        const vs = u.driver_profile?.verification_status
        const busy = setVerif.isPending && setVerif.variables?.id === u.id
        return (
          <div className="flex justify-end gap-2">
            {vs !== 'verified' && (
              <button disabled={busy} onClick={() => setVerif.mutate({ id: u.id, status: 'verified' })}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />} Verify
              </button>
            )}
            {vs !== 'rejected' && (
              <button disabled={busy} onClick={() => setVerif.mutate({ id: u.id, status: 'rejected' })}
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
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="mt-1 text-sm text-gray-500">Manage app users and verify driver profiles.</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone"
            className="w-64 rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-brand-100" />
        </div>
        <div className="flex gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setType(f.key)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${type === f.key ? 'bg-ink text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f.label}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {VERIF_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setVerification(f.key)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${verification === f.key ? 'bg-brand-400 text-ink' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f.label}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-2">
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={users}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} users` }}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  )
}
