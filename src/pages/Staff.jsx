import { useState, useEffect } from 'react'
import { Table, Tag, Modal, Form, Input, Select, Button, Popconfirm, App } from 'antd'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import useAuthStore from '../store/authStore'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { useStaff, useRoles, useSaveStaff, useDeleteStaff } from '../hooks/useRbac'

const initials = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

function StaffModal({ staff, roles, open, onClose }) {
  const isEdit = !!staff?.id
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const save = useSaveStaff({
    onSuccess: () => { message.success(isEdit ? 'Employee updated' : 'Employee added'); onClose() },
    onError: (e) => message.error(e.response?.data?.message || 'Could not save.'),
  })

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: staff?.name || '',
        email: staff?.email || '',
        password: '',
        role_id: staff?.role?.id || undefined,
        status: staff?.status || 'active',
      })
    }
  }, [open, staff, form])

  const submit = async () => {
    const v = await form.validateFields()
    const payload = { name: v.name.trim(), email: v.email.trim(), role_id: Number(v.role_id), status: v.status }
    if (v.password?.trim()) payload.password = v.password.trim()
    save.mutate({ id: staff?.id, payload })
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit ${staff.name}` : 'Add employee'}
      onCancel={onClose}
      onOk={submit}
      okText="Save"
      confirmLoading={save.isPending}
      okButtonProps={{ style: { background: '#FFD400', color: '#07163b', fontWeight: 600 } }}
    >
      <Form form={form} layout="vertical" requiredMark className="pt-2">
        <Form.Item name="name" label="Full name" rules={[{ required: true, message: 'Name is required' }, { max: 100 }]}>
          <Input placeholder="Jane Doe" />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}>
          <Input placeholder="jane@ezride.com" />
        </Form.Item>
        <Form.Item
          name="password"
          label={isEdit ? 'Password (leave blank to keep)' : 'Password'}
          rules={isEdit ? [{ min: 6, message: 'At least 6 characters' }] : [{ required: true, message: 'Password is required' }, { min: 6, message: 'At least 6 characters' }]}
        >
          <Input.Password placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="role_id" label="Role" rules={[{ required: true, message: 'Select a role' }]}>
            <Select placeholder="Select role" options={roles.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}

export default function Staff() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const me = useAuthStore((s) => s.user)
  const { data: staff = [], isLoading } = useStaff()
  const { data: roles = [] } = useRoles()
  const [editing, setEditing] = useState(undefined)

  const del = useDeleteStaff({
    onSuccess: () => message.success('Employee deleted'),
    onError: (e) => message.error(e.response?.data?.message || 'Could not delete.'),
  })

  const columns = [
    {
      title: 'Name', dataIndex: 'name',
      render: (_, s) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-semibold text-brand-400">{initials(s.name)}</span>
          <div>
            <p className="font-medium text-gray-800">{s.name}</p>
            <p className="text-xs text-gray-400">{s.email}</p>
          </div>
        </div>
      ),
    },
    { title: 'Role', width: 150, render: (_, s) => <Tag color="geekblue">{s.role?.name || '—'}</Tag> },
    {
      title: 'Status', dataIndex: 'status', width: 110,
      render: (st) => <StatusPill tone={st === 'active' ? 'green' : 'gray'}>{st}</StatusPill>,
    },
    { title: 'Last login', dataIndex: 'last_login_at', width: 130, render: fmt },
    {
      title: 'Actions', align: 'right', width: 110,
      render: (_, s) => (
        <div className="flex justify-end gap-1">
          {can('staff.update') && <Button type="text" icon={<Pencil size={16} />} onClick={() => setEditing(s)} />}
          {can('staff.delete') && s.id !== me?.id && (
            <Popconfirm title={`Delete ${s.name}?`} okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => del.mutate(s.id)}>
              <Button type="text" danger icon={<Trash2 size={16} />} loading={del.isPending && del.variables === s.id} />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="w-full">
      <PageHeader
        title="Staff"
        subtitle="Add employees and assign roles to control their access."
        actions={can('staff.create') && (
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing(null)}>Add Employee</Button>
        )}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={staff}
          columns={columns}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} staff` }}
        />
      </div>

      <StaffModal staff={editing} roles={roles} open={editing !== undefined} onClose={() => setEditing(undefined)} />
    </div>
  )
}
