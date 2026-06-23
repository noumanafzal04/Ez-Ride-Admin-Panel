import { useState, useEffect } from 'react'
import { Table, Tag, Segmented, Input, Button, Popconfirm, App } from 'antd'
import { BadgeCheck, XCircle } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import { FilterBar, FilterGroup, FilterDivider } from '../components/FilterBar'
import { useAppUsers, useSetVerification } from '../hooks/useUsers'

const VERIF_STYLE = { verified: 'success', pending: 'warning', rejected: 'error' }
const initials = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default function Users() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const [type, setType] = useState('')
  const [verification, setVerification] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Any filter change resets to page 1.
  useEffect(() => { setPage(1) }, [type, verification, search])

  const filters = {}
  if (type) filters.user_type = type
  if (verification) filters.verification = verification
  if (search.trim()) filters.search = search.trim()

  const { data, isFetching } = useAppUsers({ page, perPage: pageSize, ...filters })
  const rows = data?.rows || []
  const total = data?.total || 0

  const canVerify = can('users.update')
  const setVerif = useSetVerification({
    onSuccess: (_r, vars) => message.success(vars.status === 'verified' ? 'Driver verified' : 'Driver rejected'),
    onError: (e) => message.error(e.response?.data?.message || 'Action failed.'),
  })

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
      render: (t) => <Tag color={t === 'driver' ? 'geekblue' : 'default'}>{t === 'driver' ? 'Driver' : 'User'}</Tag>,
    },
    {
      title: 'Verification', width: 130,
      render: (_, u) => {
        const vs = u.driver_profile?.verification_status
        return u.user_type === 'driver' && vs
          ? <Tag color={VERIF_STYLE[vs] || 'default'} className="capitalize">{vs}</Tag>
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
              <Popconfirm title="Verify this driver?" okText="Verify" onConfirm={() => setVerif.mutate({ id: u.id, status: 'verified' })}>
                <Button size="small" icon={<BadgeCheck size={14} />} loading={busy} className="text-emerald-600! border-emerald-200!">Verify</Button>
              </Popconfirm>
            )}
            {vs !== 'rejected' && (
              <Popconfirm title="Reject this driver?" okText="Reject" okButtonProps={{ danger: true }} onConfirm={() => setVerif.mutate({ id: u.id, status: 'rejected' })}>
                <Button size="small" danger icon={<XCircle size={14} />} loading={busy}>Reject</Button>
              </Popconfirm>
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

      <FilterBar>
        <FilterGroup label="Search" className="flex-1 min-w-60">
          <Input.Search size="large" allowClear placeholder="Search name, email, phone" className="w-full"
            onSearch={setSearch} onChange={(e) => !e.target.value && setSearch('')} />
        </FilterGroup>
        <FilterDivider />
        <FilterGroup label="Type">
          <Segmented size="large" value={type} onChange={setType}
            options={[{ label: 'All', value: '' }, { label: 'Drivers', value: 'driver' }, { label: 'Users', value: 'user' }]} />
        </FilterGroup>
        <FilterDivider />
        <FilterGroup label="Verification">
          <Segmented size="large" value={verification} onChange={setVerification}
            options={[{ label: 'Any', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'Verified', value: 'verified' }, { label: 'Rejected', value: 'rejected' }]} />
        </FilterGroup>
      </FilterBar>

      <div className="rounded-2xl border border-gray-200 bg-white p-2">
        <Table
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true,
            showTotal: (t) => `${t} users`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </div>
    </div>
  )
}
