import { useState, useEffect } from 'react'
import { Table, Tag, Select, Button, Popconfirm, App, Modal, Form, Input, Tooltip } from 'antd'
import { BadgeCheck, XCircle, PauseCircle, Plus, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { FilterBar, FilterGroup } from '../components/FilterBar'
import { useProviders, useSetProviderStatus, useCreateProvider } from '../hooks/useProviders'
import adminService from '../services/adminService'

const STATUS_TONE = { approved: 'green', pending: 'amber', rejected: 'red', suspended: 'gray' }
const initials = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

const exportCsv = (rows) => {
  const head = ['ID', 'Business', 'Phone', 'City', 'Status', 'Categories']
  const body = rows.map((p) => [p.id, p.business_name, p.phone, p.city?.name, p.status, (p.categories || []).map((c) => c.name).join(' / ')])
  const csv = [head, ...body].map((r) => r.map((c) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'providers.csv'; a.click()
  URL.revokeObjectURL(url)
}

function AddProviderModal({ open, onClose }) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { data: cities = [] } = useQuery({
    queryKey: ['admin-cities'], enabled: open, staleTime: 36e5,
    queryFn: () => adminService.cities().then((r) => r.data?.data?.cities || []),
  })
  const { data: cats = [] } = useQuery({
    queryKey: ['admin-service-categories'], enabled: open, staleTime: 36e5,
    queryFn: () => adminService.serviceCategories().then((r) => r.data?.data?.categories || []),
  })
  const create = useCreateProvider({
    onSuccess: () => { message.success('Provider created'); form.resetFields(); onClose() },
    onError: (e) => message.error(e.response?.data?.message || 'Could not create provider.'),
  })
  return (
    <Modal
      title="Add service provider"
      open={open}
      onCancel={onClose}
      okText="Create provider"
      confirmLoading={create.isPending}
      onOk={() => form.validateFields().then((v) => create.mutate(v))}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="pt-2">
        <Form.Item name="business_name" label="Business name" rules={[{ required: true }]}>
          <Input placeholder="e.g. Ali Auto Workshop" />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item name="phone_number" label="Owner phone" rules={[{ required: true }]} className="flex-1"
            tooltip="We link to this user if they exist, otherwise create the account.">
            <Input placeholder="03001234567" />
          </Form.Item>
          <Form.Item name="first_name" label="Owner name" className="flex-1">
            <Input placeholder="Optional" />
          </Form.Item>
        </div>
        <Form.Item name="category_ids" label="Services offered" rules={[{ required: true, message: 'Pick at least one' }]}>
          <Select mode="multiple" placeholder="Choose categories" optionFilterProp="label"
            options={cats.map((c) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <div className="flex gap-3">
          <Form.Item name="city_id" label="City" className="flex-1">
            <Select showSearch allowClear placeholder="City" optionFilterProp="label"
              options={cities.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="area" label="Area" className="flex-1">
            <Input placeholder="Area / locality" />
          </Form.Item>
        </div>
        <Form.Item name="description" label="About">
          <Input.TextArea rows={3} placeholder="Optional description" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default function Providers() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => { setPage(1) }, [status])

  const { data, isFetching, refetch } = useProviders({ page, perPage: pageSize, status })
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
      render: (s) => <StatusPill tone={STATUS_TONE[s] || 'gray'}>{s}</StatusPill>,
    },
    {
      title: '', align: 'right', width: 150,
      render: (_, p) => {
        if (!canManage) return null
        const busy = setStatusMut.isPending && setStatusMut.variables?.id === p.id
        return (
          <div className="flex justify-end gap-1.5">
            {p.status !== 'approved' && (
              <Popconfirm title="Approve this provider?" okText="Approve" onConfirm={() => setStatusMut.mutate({ id: p.id, status: 'approved' })}>
                <Tooltip title="Approve"><Button size="small" type="text" icon={<BadgeCheck size={17} />} loading={busy} className="text-emerald-600!" /></Tooltip>
              </Popconfirm>
            )}
            {p.status === 'approved' && (
              <Popconfirm title="Suspend this provider?" okText="Suspend" onConfirm={() => setStatusMut.mutate({ id: p.id, status: 'suspended' })}>
                <Tooltip title="Suspend"><Button size="small" type="text" icon={<PauseCircle size={17} />} loading={busy} className="text-amber-600!" /></Tooltip>
              </Popconfirm>
            )}
            {p.status !== 'rejected' && (
              <Popconfirm title="Reject this provider?" okText="Reject" okButtonProps={{ danger: true }} onConfirm={() => setStatusMut.mutate({ id: p.id, status: 'rejected' })}>
                <Tooltip title="Reject"><Button size="small" type="text" danger icon={<XCircle size={17} />} loading={busy} /></Tooltip>
              </Popconfirm>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full">
      <PageHeader
        title="Service Providers"
        subtitle="Review and verify car-service providers."
        onRefresh={refetch}
        refreshing={isFetching}
        actions={
          <>
            <Tooltip title="Export CSV"><Button icon={<Download size={16} />} onClick={() => exportCsv(rows)} /></Tooltip>
            {canManage && <Button type="primary" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>Add provider</Button>}
          </>
        }
      />

      <FilterBar>
        <FilterGroup>
          <Select size="large" value={status} onChange={setStatus} options={[
            { label: 'All statuses', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' }, { label: 'Suspended', value: 'suspended' },
          ]} />
        </FilterGroup>
      </FilterBar>

      <AddProviderModal open={addOpen} onClose={() => setAddOpen(false)} />

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
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
