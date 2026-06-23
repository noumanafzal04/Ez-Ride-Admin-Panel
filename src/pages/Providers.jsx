import { useState, useEffect } from 'react'
import { Table, Tag, Segmented, Button, Popconfirm, App } from 'antd'
import { BadgeCheck, XCircle, PauseCircle } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import { FilterBar, FilterGroup } from '../components/FilterBar'
import { useProviders, useSetProviderStatus } from '../hooks/useProviders'

const STATUS_COLOR = { approved: 'success', pending: 'warning', rejected: 'error', suspended: 'default' }
const initials = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function Providers() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => { setPage(1) }, [status])

  const { data, isFetching } = useProviders({ page, perPage: pageSize, status })
  const rows = data?.rows || []
  const total = data?.total || 0

  const canManage = can('providers.update')
  const setStatusMut = useSetProviderStatus({
    onSuccess: (_r, v) => message.success(`Provider ${v.status}`),
    onError: (e) => message.error(e.response?.data?.message || 'Action failed.'),
  })

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
          {(p.categories || []).slice(0, 3).map((c) => <Tag key={c.id} className="m-0!">{c.name}</Tag>)}
        </div>
      ),
    },
    { title: 'City', width: 120, render: (_, p) => <span className="text-gray-600">{p.city?.name || '—'}</span> },
    {
      title: 'Status', dataIndex: 'status', width: 120,
      render: (s) => <Tag color={STATUS_COLOR[s] || 'default'} className="capitalize">{s}</Tag>,
    },
    {
      title: 'Actions', align: 'right', width: 280,
      render: (_, p) => {
        if (!canManage) return null
        const busy = setStatusMut.isPending && setStatusMut.variables?.id === p.id
        return (
          <div className="flex justify-end gap-2">
            {p.status !== 'approved' && (
              <Popconfirm title="Approve this provider?" okText="Approve" onConfirm={() => setStatusMut.mutate({ id: p.id, status: 'approved' })}>
                <Button size="small" icon={<BadgeCheck size={14} />} loading={busy} className="text-emerald-600! border-emerald-200!">Approve</Button>
              </Popconfirm>
            )}
            {p.status === 'approved' && (
              <Popconfirm title="Suspend this provider?" okText="Suspend" onConfirm={() => setStatusMut.mutate({ id: p.id, status: 'suspended' })}>
                <Button size="small" icon={<PauseCircle size={14} />} loading={busy}>Suspend</Button>
              </Popconfirm>
            )}
            {p.status !== 'rejected' && (
              <Popconfirm title="Reject this provider?" okText="Reject" okButtonProps={{ danger: true }} onConfirm={() => setStatusMut.mutate({ id: p.id, status: 'rejected' })}>
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
        <h1 className="text-2xl font-bold text-gray-900">Service Providers</h1>
        <p className="mt-1 text-sm text-gray-500">Review and verify car-service providers.</p>
      </div>

      <FilterBar>
        <FilterGroup label="Status">
          <Segmented size="large" value={status} onChange={setStatus} options={[
            { label: 'All', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' }, { label: 'Suspended', value: 'suspended' },
          ]} />
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
            showTotal: (t) => `${t} providers`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </div>
    </div>
  )
}
