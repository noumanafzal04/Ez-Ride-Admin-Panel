import { useState, useEffect, useMemo } from 'react'
import { Tabs, Modal, Form, Input, Checkbox, Button, Popconfirm, Tag, Table, Spin, App } from 'antd'
import { ShieldCheck, Plus, Pencil, Trash2, Lock, Users as UsersIcon } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import {
  useRoles, useRole, usePermissionsCatalog, useSaveRole, useDeleteRole, useStaff,
} from '../hooks/useRbac'

const groupByModule = (catalog) =>
  catalog.reduce((acc, p) => { (acc[p.module] ||= []).push(p); return acc }, {})
const initials = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

/* ─────────── Role create/edit modal with permission matrix ─────────── */
function RoleModal({ role, open, onClose }) {
  const isEdit = !!role?.id
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const { data: catalog = [] } = usePermissionsCatalog()
  const { data: detail } = useRole(isEdit && open ? role.id : null)

  const [selected, setSelected] = useState(() => new Set())
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (!open) { setSeeded(false); return }
    if (!isEdit && !seeded) {
      form.setFieldsValue({ name: '', description: '' })
      setSelected(new Set()); setSeeded(true)
    }
    if (isEdit && detail && !seeded) {
      form.setFieldsValue({ name: detail.name || '', description: detail.description || '' })
      setSelected(new Set(detail.permissions || [])); setSeeded(true)
    }
  }, [open, isEdit, detail, seeded, form])

  const grouped = useMemo(() => groupByModule(catalog), [catalog])
  const toggle = (key) => setSelected((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })
  const toggleModule = (perms) => setSelected((s) => {
    const n = new Set(s); const allOn = perms.every((p) => n.has(p.key))
    perms.forEach((p) => (allOn ? n.delete(p.key) : n.add(p.key))); return n
  })

  const save = useSaveRole({
    onSuccess: () => { message.success(isEdit ? 'Role updated' : 'Role created'); onClose() },
    onError: (e) => message.error(e.response?.data?.message || 'Could not save the role.'),
  })

  const submit = async () => {
    const v = await form.validateFields()
    save.mutate({ id: role?.id, payload: { name: v.name.trim(), description: v.description?.trim() || null, permissions: [...selected] } })
  }

  return (
    <Modal open={open} onCancel={onClose} onOk={submit} okText="Save role" width={680}
      title={isEdit ? `Edit role · ${role.name}` : 'New role'}
      confirmLoading={save.isPending}
      okButtonProps={{ style: { background: '#FFD400', color: '#07163b', fontWeight: 600 } }}
      styles={{ body: { maxHeight: '68vh', overflowY: 'auto' } }}>
      <Form form={form} layout="vertical" requiredMark className="pt-2">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Form.Item name="name" label="Role name" rules={[{ required: true, message: 'Role name is required' }, { max: 60 }]}>
            <Input placeholder="e.g. Support" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input placeholder="Optional" />
          </Form.Item>
        </div>
      </Form>

      <p className="mb-3 mt-1 text-sm font-semibold text-gray-700">Permissions</p>
      <div className="space-y-3">
        {Object.entries(grouped).map(([module, perms]) => {
          const keys = perms.map((p) => p.key)
          const on = keys.filter((k) => selected.has(k)).length
          const all = on === keys.length
          return (
            <div key={module} className="rounded-xl border border-gray-200 p-3.5">
              <div className="mb-2.5 flex items-center justify-between border-b border-gray-100 pb-2">
                <Checkbox checked={all} indeterminate={on > 0 && !all} onChange={() => toggleModule(perms)}>
                  <span className="text-sm font-semibold capitalize text-gray-800">{module}</span>
                </Checkbox>
                <span className="text-xs text-gray-400">{on}/{keys.length}</span>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 pl-1">
                {perms.map((p) => (
                  <Checkbox key={p.key} checked={selected.has(p.key)} onChange={() => toggle(p.key)}>
                    <span className="text-sm capitalize text-gray-600">{p.action}</span>
                  </Checkbox>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

/* ─────────── Roles grid ─────────── */
function RolesGrid() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const { data: roles = [], isLoading } = useRoles()
  const [editing, setEditing] = useState(undefined)
  const del = useDeleteRole({
    onSuccess: () => message.success('Role deleted'),
    onError: (e) => message.error(e.response?.data?.message || 'Could not delete.'),
  })

  return (
    <>
      <div className="mb-4 flex justify-end">
        {can('roles.create') && (
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing(null)}
            style={{ background: '#FFD400', color: '#07163b', fontWeight: 600 }}>New Role</Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spin /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-ink"><ShieldCheck size={20} /></span>
                {role.is_system && <Tag icon={<Lock size={11} className="inline -mt-0.5 mr-1" />}>System</Tag>}
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">{role.name}</h3>
              <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{role.description || '—'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Tag color="geekblue">{role.permissions_count ?? 0} permissions</Tag>
                <Tag>{role.staff_count ?? 0} staff</Tag>
              </div>
              <div className="mt-4 flex gap-2">
                {can('roles.update') && <Button size="small" icon={<Pencil size={14} />} onClick={() => setEditing(role)}>Edit</Button>}
                {can('roles.delete') && !role.is_system && (
                  <Popconfirm title={`Delete role "${role.name}"?`} okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => del.mutate(role.id)}>
                    <Button size="small" danger icon={<Trash2 size={14} />} loading={del.isPending && del.variables === role.id}>Delete</Button>
                  </Popconfirm>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RoleModal role={editing} open={editing !== undefined} onClose={() => setEditing(undefined)} />
    </>
  )
}

/* ─────────── Staff (users) + their role ─────────── */
function StaffByRole() {
  const { data: staff = [], isLoading } = useStaff()
  const columns = [
    {
      title: 'User', dataIndex: 'name',
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
    { title: 'Role', width: 160, render: (_, s) => <Tag color="geekblue">{s.role?.name || '—'}</Tag> },
    { title: 'Status', dataIndex: 'status', width: 110, render: (st) => <Tag color={st === 'active' ? 'success' : 'default'} className="capitalize">{st}</Tag> },
    { title: 'Last login', dataIndex: 'last_login_at', width: 140, render: fmt },
  ]
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-2">
      <Table rowKey="id" loading={isLoading} dataSource={staff} columns={columns} scroll={{ x: 'max-content' }}
        pagination={{ pageSize: 10, showTotal: (t) => `${t} users` }} />
    </div>
  )
}

export default function Roles() {
  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Roles &amp; Permissions</h1>
        <p className="mt-1 text-sm text-gray-500">Define what each role can access, and see who has which role.</p>
      </div>

      <Tabs
        items={[
          { key: 'roles', label: <span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Roles</span>, children: <RolesGrid /> },
          { key: 'users', label: <span className="flex items-center gap-1.5"><UsersIcon size={15} /> Users</span>, children: <StaffByRole /> },
        ]}
      />
    </div>
  )
}
