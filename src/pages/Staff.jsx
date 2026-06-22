import { useState } from 'react'
import { Table } from 'antd'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import Modal from '../components/Modal'
import usePermissions from '../hooks/usePermissions'
import useAuthStore from '../store/authStore'
import { useStaff, useRoles, useSaveStaff, useDeleteStaff } from '../hooks/useRbac'

const initials = (n) => (n || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

function StaffModal({ staff, roles, onClose }) {
  const isEdit = !!staff?.id
  const [name, setName] = useState(staff?.name || '')
  const [email, setEmail] = useState(staff?.email || '')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState(staff?.role?.id || '')
  const [status, setStatus] = useState(staff?.status || 'active')
  const [error, setError] = useState('')

  const save = useSaveStaff({
    onSuccess: onClose,
    onError: (e) => setError(e.response?.data?.message || 'Could not save.'),
  })

  const submit = () => {
    setError('')
    if (!name.trim() || !email.trim() || !roleId) { setError('Name, email and role are required.'); return }
    if (!isEdit && !password.trim()) { setError('Password is required.'); return }
    const payload = { name: name.trim(), email: email.trim(), role_id: Number(roleId), status }
    if (password.trim()) payload.password = password.trim()
    save.mutate({ id: staff?.id, payload })
  }

  const input = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-brand-100'

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Edit ${staff.name}` : 'Add employee'}
      footer={
        <>
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={save.isPending} className="flex items-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand-500 disabled:opacity-60">
            {save.isPending && <Loader2 size={16} className="animate-spin" />} Save
          </button>
        </>
      }
    >
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="Jane Doe" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} placeholder="jane@ezride.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Password {isEdit && <span className="text-gray-400">(leave blank to keep)</span>}
          </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} placeholder="••••••••" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Role</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={input}>
              <option value="">Select role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function Staff() {
  const { can } = usePermissions()
  const me = useAuthStore((s) => s.user)
  const { data: staff = [], isLoading } = useStaff()
  const { data: roles = [] } = useRoles()
  const [editing, setEditing] = useState(undefined)
  const del = useDeleteStaff({ onError: (e) => alert(e.response?.data?.message || 'Could not delete.') })

  const remove = (s) => { if (window.confirm(`Delete ${s.name}?`)) del.mutate(s.id) }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="mt-1 text-sm text-gray-500">Add employees and assign roles to control their access.</p>
        </div>
        {can('staff.create') && (
          <button onClick={() => setEditing(null)} className="flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-brand-500">
            <Plus size={18} /> Add Employee
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-2">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={staff}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} staff` }}
          scroll={{ x: 'max-content' }}
          columns={[
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
            { title: 'Role', width: 150, render: (_, s) => <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-ink">{s.role?.name || '—'}</span> },
            {
              title: 'Status', dataIndex: 'status', width: 110,
              render: (st) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${st === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>{st}</span>,
            },
            { title: 'Last login', dataIndex: 'last_login_at', width: 130, render: fmt },
            {
              title: 'Actions', align: 'right', width: 110,
              render: (_, s) => (
                <div className="flex justify-end gap-2">
                  {can('staff.update') && <button onClick={() => setEditing(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil size={17} /></button>}
                  {can('staff.delete') && s.id !== me?.id && <button onClick={() => remove(s)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>}
                </div>
              ),
            },
          ]}
        />
      </div>

      {editing !== undefined && <StaffModal staff={editing} roles={roles} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
