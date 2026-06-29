import { useState, useEffect } from 'react'
import { Table, Select, Input, Button, Popconfirm, App, Modal, Form, Switch, Tooltip } from 'antd'
import { BadgeCheck, XCircle, UserPlus, Users as UsersIcon, Car, UserCheck, Clock, Download } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'
import { StatCard, StatCards } from '../components/StatCard'
import StatusPill from '../components/StatusPill'
import { FilterBar, FilterGroup } from '../components/FilterBar'
import { useAppUsers, useUserStats, useSetVerification, useCreateAppUser } from '../hooks/useUsers'

function AddUserModal({ open, onClose }) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const create = useCreateAppUser({
    onSuccess: () => { message.success('User created'); form.resetFields(); onClose() },
    onError: (e) => message.error(e.response?.data?.message || 'Could not create user.'),
  })
  return (
    <Modal
      title="Add user"
      open={open}
      onCancel={onClose}
      okText="Create user"
      confirmLoading={create.isPending}
      onOk={() => form.validateFields().then((v) => create.mutate(v))}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ user_type: 'user', verified: true }} className="pt-2">
        <div className="flex gap-3">
          <Form.Item name="first_name" label="First name" rules={[{ required: true }]} className="flex-1">
            <Input placeholder="First name" />
          </Form.Item>
          <Form.Item name="last_name" label="Last name" className="flex-1">
            <Input placeholder="Last name" />
          </Form.Item>
        </div>
        <Form.Item name="phone_number" label="Phone number" rules={[{ required: true }]}>
          <Input placeholder="03001234567" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
          <Input placeholder="user@example.com (optional)" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
          <Input.Password placeholder="Min 6 characters" />
        </Form.Item>
        <div className="flex items-center gap-4">
          <Form.Item name="user_type" label="Role" className="flex-1">
            <Select options={[{ value: 'user', label: 'Rider' }, { value: 'driver', label: 'Driver' }]} />
          </Form.Item>
          <Form.Item name="verified" label="Verified" valuePropName="checked" tooltip="Mark phone verified so they can log in right away">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}

const VERIF_TONE = { verified: 'green', pending: 'amber', rejected: 'red' }
const initials = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

const exportCsv = (rows) => {
  const head = ['ID', 'Name', 'Email', 'Phone', 'Type', 'Verification', 'Joined']
  const body = rows.map((u) => [u.id, u.name, u.email, u.phone, u.user_type, u.driver_profile?.verification_status || '', u.created_at])
  const csv = [head, ...body].map((r) => r.map((c) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'users.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function Users() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const [type, setType] = useState('')
  const [verification, setVerification] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [addOpen, setAddOpen] = useState(false)

  // Any filter change resets to page 1.
  useEffect(() => { setPage(1) }, [type, verification, search])

  const filters = {}
  if (type) filters.user_type = type
  if (verification) filters.verification = verification
  if (search.trim()) filters.search = search.trim()

  const { data, isFetching, refetch } = useAppUsers({ page, perPage: pageSize, ...filters })
  const { data: stats = {} } = useUserStats()
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
      render: (t) => <StatusPill tone={t === 'driver' ? 'violet' : 'gray'}>{t === 'driver' ? 'Driver' : 'User'}</StatusPill>,
    },
    {
      title: 'Verification', width: 140,
      render: (_, u) => {
        const vs = u.driver_profile?.verification_status
        return u.user_type === 'driver' && vs
          ? <StatusPill tone={VERIF_TONE[vs] || 'gray'}>{vs}</StatusPill>
          : <span className="text-gray-300">—</span>
      },
    },
    { title: 'Joined', dataIndex: 'created_at', width: 130, render: fmt },
    {
      title: '', align: 'right', width: 120,
      render: (_, u) => {
        if (u.user_type !== 'driver' || !canVerify) return null
        const vs = u.driver_profile?.verification_status
        const busy = setVerif.isPending && setVerif.variables?.id === u.id
        return (
          <div className="flex justify-end gap-1.5">
            {vs !== 'verified' && (
              <Popconfirm title="Verify this driver?" okText="Verify" onConfirm={() => setVerif.mutate({ id: u.id, status: 'verified' })}>
                <Tooltip title="Verify"><Button size="small" type="text" icon={<BadgeCheck size={17} />} loading={busy} className="text-emerald-600!" /></Tooltip>
              </Popconfirm>
            )}
            {vs !== 'rejected' && (
              <Popconfirm title="Reject this driver?" okText="Reject" okButtonProps={{ danger: true }} onConfirm={() => setVerif.mutate({ id: u.id, status: 'rejected' })}>
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
        title="Users"
        subtitle="Manage app users and verify driver profiles."
        onRefresh={refetch}
        refreshing={isFetching}
        actions={
          <>
            <Tooltip title="Export CSV">
              <Button icon={<Download size={16} />} onClick={() => exportCsv(rows)} />
            </Tooltip>
            {canVerify && (
              <Button type="primary" icon={<UserPlus size={16} />} onClick={() => setAddOpen(true)}>Add user</Button>
            )}
          </>
        }
      />

      <StatCards>
        <StatCard tone="violet" label="Total users" value={stats.total} icon={UsersIcon} />
        <StatCard tone="teal" label="Drivers" value={stats.drivers} icon={Car} />
        <StatCard tone="blue" label="Riders" value={stats.riders} icon={UserCheck} />
        <StatCard tone="amber" label="Pending verification" value={stats.pending_drivers} icon={Clock} />
      </StatCards>

      <FilterBar
        search={
          <Input.Search size="large" allowClear placeholder="Search name, email or phone…"
            onSearch={setSearch} onChange={(e) => !e.target.value && setSearch('')} />
        }
      >
        <FilterGroup>
          <Select size="large" value={type} onChange={setType}
            options={[{ label: 'All types', value: '' }, { label: 'Drivers', value: 'driver' }, { label: 'Riders', value: 'user' }]} />
        </FilterGroup>
        <FilterGroup>
          <Select size="large" value={verification} onChange={setVerification}
            options={[{ label: 'Any verification', value: '' }, { label: 'Pending', value: 'pending' }, { label: 'Verified', value: 'verified' }, { label: 'Rejected', value: 'rejected' }]} />
        </FilterGroup>
      </FilterBar>

      <AddUserModal open={addOpen} onClose={() => setAddOpen(false)} />

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <Table
          rowKey="id"
          rowSelection={{ type: 'checkbox' }}
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
