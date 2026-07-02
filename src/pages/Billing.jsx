import { useState, useEffect } from 'react'
import {
  Tabs, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Switch, Popconfirm, App,
} from 'antd'
import { Plus, Pencil, Trash2, CreditCard, Gift, SlidersHorizontal } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { FilterBar, FilterGroup } from '../components/FilterBar'
import {
  useBillingPlans, useSaveBillingPlan, useDeleteBillingPlan,
  useBillingSettings, useUpdateBillingSetting,
  useBillingSubscriptions, useGrantSubscription,
} from '../hooks/useBilling'
import { useAppUsers } from '../hooks/useUsers'

const MODULES = [
  { key: 'ride', label: 'Ride' }, { key: 'service', label: 'Service Provider' },
]
const MODULE_LABEL = Object.fromEntries(MODULES.map((m) => [m.key, m.label]))
const FREE_MODE_LABEL = { active_cap: 'Concurrent active items', category_cap: 'Categories', intro_credit: 'Lifetime free posts' }
const money = (n) => `Rs. ${Number(n || 0).toLocaleString()}`
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

/* ─────────── Plans ─────────── */
function PlanModal({ plan, open, onClose }) {
  const isEdit = !!plan?.id
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const save = useSaveBillingPlan({
    onSuccess: () => { message.success(isEdit ? 'Plan updated' : 'Plan created'); onClose() },
    onError: (e) => message.error(e.response?.data?.message || 'Could not save.'),
  })
  useEffect(() => {
    if (open) form.setFieldsValue({
      module: plan?.module || 'ride', name: plan?.name || '',
      duration_days: plan?.duration_days || 1, post_limit: plan?.post_limit || 5,
      price: plan?.price ?? 0, is_active: plan?.is_active ?? true,
    })
  }, [open, plan, form])

  const submit = async () => {
    const v = await form.validateFields()
    save.mutate({ id: plan?.id, payload: v })
  }
  return (
    <Modal open={open} title={isEdit ? `Edit ${plan.name}` : 'New plan'} onCancel={onClose} onOk={submit}
      okText="Save" confirmLoading={save.isPending} okButtonProps={{ style: { background: '#FFD400', color: '#07163b', fontWeight: 600 } }}>
      <Form form={form} layout="vertical" className="pt-2">
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="module" label="Module" rules={[{ required: true }]}>
            <Select options={MODULES.map((m) => ({ value: m.key, label: m.label }))} />
          </Form.Item>
          <Form.Item name="name" label="Plan name" rules={[{ required: true, message: 'Name required' }]}>
            <Input placeholder="Weekly" />
          </Form.Item>
          <Form.Item name="duration_days" label="Duration (days)" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} max={3650} />
          </Form.Item>
          <Form.Item name="post_limit" label="Posts allowed" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} max={100000} />
          </Form.Item>
          <Form.Item name="price" label="Price (Rs.)">
            <InputNumber className="w-full" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v.replace(/[^\d]/g, '')} />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}

function PlansTab() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const canManage = can('billing.update')
  const { data: plans = [], isLoading } = useBillingPlans()
  const [editing, setEditing] = useState(undefined)
  const del = useDeleteBillingPlan({ onSuccess: () => message.success('Plan deleted'), onError: (e) => message.error(e.response?.data?.message || 'Failed.') })

  const columns = [
    { title: 'Module', dataIndex: 'module', width: 130, render: (m) => <Tag color="geekblue">{MODULE_LABEL[m] || m}</Tag> },
    { title: 'Plan', dataIndex: 'name', render: (n) => <span className="font-medium text-gray-800">{n}</span> },
    { title: 'Duration', dataIndex: 'duration_days', width: 110, render: (d) => `${d} day${d > 1 ? 's' : ''}` },
    { title: 'Posts', dataIndex: 'post_limit', width: 90 },
    { title: 'Price', dataIndex: 'price', width: 120, render: money },
    { title: 'Active', dataIndex: 'is_active', width: 100, render: (a) => <StatusPill tone={a ? 'green' : 'gray'}>{a ? 'Active' : 'Off'}</StatusPill> },
    ...(canManage ? [{
      title: 'Actions', align: 'right', width: 110,
      render: (_, p) => (
        <div className="flex justify-end gap-1">
          <Button type="text" icon={<Pencil size={16} />} onClick={() => setEditing(p)} />
          <Popconfirm title={`Delete ${p.name}?`} okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => del.mutate(p.id)}>
            <Button type="text" danger icon={<Trash2 size={16} />} loading={del.isPending && del.variables === p.id} />
          </Popconfirm>
        </div>
      ),
    }] : []),
  ]

  return (
    <>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing(null)} style={{ background: '#FFD400', color: '#07163b', fontWeight: 600 }}>New Plan</Button>
        </div>
      )}
      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <Table rowKey="id" loading={isLoading} columns={columns} dataSource={plans} scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 12, showTotal: (t) => `${t} plans` }} />
      </div>
      <PlanModal plan={editing} open={editing !== undefined} onClose={() => setEditing(undefined)} />
    </>
  )
}

/* ─────────── Module settings ─────────── */
function SettingCard({ s }) {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const canManage = can('billing.update')
  const [limit, setLimit] = useState(s.free_limit)
  const [enabled, setEnabled] = useState(s.enforcement_enabled)
  useEffect(() => { setLimit(s.free_limit); setEnabled(s.enforcement_enabled) }, [s])

  const save = useUpdateBillingSetting({ onSuccess: () => message.success(`${MODULE_LABEL[s.module]} updated`), onError: (e) => message.error(e.response?.data?.message || 'Failed.') })
  const dirty = limit !== s.free_limit || enabled !== s.enforcement_enabled

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-ink">{MODULE_LABEL[s.module]}</h3>
        <StatusPill tone={enabled ? 'red' : 'green'}>{enabled ? 'Paid enforced' : 'Free for all'}</StatusPill>
      </div>
      <div className="space-y-4">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Free allowance — {FREE_MODE_LABEL[s.free_mode] || s.free_mode}</p>
          <InputNumber value={limit} onChange={(v) => setLimit(v ?? 0)} min={0} max={100000} disabled={!canManage} className="w-40" addonAfter="free" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Enforce paid plans</p>
            <p className="text-xs text-gray-400">Off = everyone posts free</p>
          </div>
          <Switch checked={enabled} onChange={setEnabled} disabled={!canManage} />
        </div>
        {canManage && (
          <Button type="primary" block disabled={!dirty} loading={save.isPending && save.variables?.module === s.module}
            onClick={() => save.mutate({ module: s.module, payload: { free_limit: limit, enforcement_enabled: enabled } })}>
            Save
          </Button>
        )}
      </div>
    </div>
  )
}

function SettingsTab() {
  const { data: settings = [], isLoading } = useBillingSettings()
  if (isLoading) return <div className="py-10 text-center text-gray-400">Loading…</div>
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {settings.map((s) => <SettingCard key={s.module} s={s} />)}
    </div>
  )
}

/* ─────────── Subscriptions ─────────── */
function GrantModal({ open, onClose }) {
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const [q, setQ] = useState('')
  const { data: usersData } = useAppUsers({ page: 1, perPage: 10, search: q })
  const users = usersData?.rows || []
  const { data: plans = [] } = useBillingPlans()
  const grant = useGrantSubscription({
    onSuccess: () => { message.success('Plan granted'); onClose() },
    onError: (e) => message.error(e.response?.data?.message || 'Failed.'),
  })
  useEffect(() => { if (open) { form.resetFields(); setQ('') } }, [open, form])

  const submit = async () => {
    const v = await form.validateFields()
    grant.mutate({ user_id: v.user_id, plan_id: v.plan_id })
  }
  return (
    <Modal open={open} title="Grant a plan" onCancel={onClose} onOk={submit} okText="Grant"
      confirmLoading={grant.isPending} okButtonProps={{ style: { background: '#FFD400', color: '#07163b', fontWeight: 600 } }}>
      <Form form={form} layout="vertical" className="pt-2">
        <Form.Item name="user_id" label="User" rules={[{ required: true, message: 'Pick a user' }]}>
          <Select showSearch filterOption={false} onSearch={setQ} placeholder="Search name / phone / email"
            options={users.map((u) => ({ value: u.id, label: `${u.name || 'User'} · ${u.phone || u.email || ''}` }))} notFoundContent={q ? 'No users' : 'Type to search'} />
        </Form.Item>
        <Form.Item name="plan_id" label="Plan" rules={[{ required: true, message: 'Pick a plan' }]}>
          <Select placeholder="Select plan"
            options={plans.filter((p) => p.is_active).map((p) => ({ value: p.id, label: `${MODULE_LABEL[p.module]} · ${p.name} — ${p.duration_days}d / ${p.post_limit} posts` }))} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

function SubscriptionsTab() {
  const { can } = usePermissions()
  const canManage = can('billing.update')
  const [module, setModule] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [grantOpen, setGrantOpen] = useState(false)
  useEffect(() => { setPage(1) }, [module, status])

  const { data, isFetching } = useBillingSubscriptions({ page, perPage: pageSize, module, status })
  const rows = data?.rows || []
  const total = data?.total || 0

  const columns = [
    { title: 'User', render: (_, s) => (<div><p className="font-medium text-gray-800">{s.user?.name || '—'}</p><p className="text-xs text-gray-400">{s.user?.phone || ''}</p></div>) },
    { title: 'Module', dataIndex: 'module', width: 120, render: (m) => <Tag color="geekblue">{MODULE_LABEL[m] || m}</Tag> },
    { title: 'Plan', width: 110, render: (_, s) => s.plan?.name || '—' },
    { title: 'Usage', width: 140, render: (_, s) => <span className="text-gray-600">{s.posts_used}/{s.posts_allowed} <span className="text-gray-400">({s.posts_left} left)</span></span> },
    { title: 'Ends', dataIndex: 'ends_at', width: 120, render: fmtDate },
    { title: 'Status', dataIndex: 'status', width: 110, render: (st) => <StatusPill tone={st === 'active' ? 'green' : st === 'expired' ? 'gray' : 'red'}>{st}</StatusPill> },
    { title: 'Source', dataIndex: 'source', width: 90, render: (src) => <Tag>{src}</Tag> },
  ]

  return (
    <>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <Button type="primary" icon={<Gift size={16} />} onClick={() => setGrantOpen(true)}>Grant plan</Button>
        </div>
      )}
      <FilterBar>
        <FilterGroup>
          <Select size="large" value={module} onChange={setModule} options={[{ label: 'All modules', value: '' }, ...MODULES.map((m) => ({ label: m.label, value: m.key }))]} />
        </FilterGroup>
        <FilterGroup>
          <Select size="large" value={status} onChange={setStatus} options={[{ label: 'All statuses', value: '' }, { label: 'Active', value: 'active' }, { label: 'Expired', value: 'expired' }, { label: 'Cancelled', value: 'cancelled' }]} />
        </FilterGroup>
      </FilterBar>

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <Table rowKey="id" loading={isFetching} columns={columns} dataSource={rows} scroll={{ x: 'max-content' }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `${t} subscriptions`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </div>
      <GrantModal open={grantOpen} onClose={() => setGrantOpen(false)} />
    </>
  )
}

export default function Billing() {
  return (
    <div className="w-full">
      <PageHeader
        title="Billing & Subscriptions"
        subtitle="Plans, free limits per module, and member subscriptions."
      />
      <Tabs items={[
        { key: 'plans', label: <span className="flex items-center gap-1.5"><CreditCard size={15} /> Plans</span>, children: <PlansTab /> },
        { key: 'settings', label: <span className="flex items-center gap-1.5"><SlidersHorizontal size={15} /> Free limits</span>, children: <SettingsTab /> },
        { key: 'subs', label: <span className="flex items-center gap-1.5"><Gift size={15} /> Subscriptions</span>, children: <SubscriptionsTab /> },
      ]} />
    </div>
  )
}
