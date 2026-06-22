import { useState, useEffect, useMemo } from 'react'
import { ShieldCheck, Plus, Pencil, Trash2, Lock, Loader2 } from 'lucide-react'
import Modal from '../components/Modal'
import usePermissions from '../hooks/usePermissions'
import {
  useRoles, useRole, usePermissionsCatalog, useSaveRole, useDeleteRole,
} from '../hooks/useRbac'

const groupByModule = (catalog) =>
  catalog.reduce((acc, p) => { (acc[p.module] ||= []).push(p); return acc }, {})

function RoleModal({ role, onClose }) {
  const isEdit = !!role?.id
  const { data: catalog = [] } = usePermissionsCatalog()
  const { data: detail } = useRole(isEdit ? role.id : null)

  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [selected, setSelected] = useState(() => new Set())
  const [seeded, setSeeded] = useState(!isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isEdit && detail && !seeded) {
      setName(detail.name || '')
      setDescription(detail.description || '')
      setSelected(new Set(detail.permissions || []))
      setSeeded(true)
    }
  }, [detail, isEdit, seeded])

  const grouped = useMemo(() => groupByModule(catalog), [catalog])
  const toggle = (key) => setSelected((s) => {
    const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n
  })
  const toggleModule = (perms) => setSelected((s) => {
    const n = new Set(s)
    const allOn = perms.every((p) => n.has(p.key))
    perms.forEach((p) => (allOn ? n.delete(p.key) : n.add(p.key)))
    return n
  })

  const save = useSaveRole({
    onSuccess: onClose,
    onError: (e) => setError(e.response?.data?.message || 'Could not save the role.'),
  })

  const submit = () => {
    setError('')
    if (!name.trim()) { setError('Role name is required.'); return }
    save.mutate({ id: role?.id, payload: { name: name.trim(), description: description.trim() || null, permissions: [...selected] } })
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit role · ${role.name}` : 'New role'}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Role name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Support"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-brand-100" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-brand-100" />
        </div>
      </div>

      <p className="mb-2 mt-6 text-sm font-semibold text-gray-700">Permissions</p>
      <div className="space-y-3">
        {Object.entries(grouped).map(([module, perms]) => {
          const allOn = perms.every((p) => selected.has(p.key))
          return (
            <div key={module} className="rounded-xl border border-gray-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold capitalize text-gray-800">{module}</span>
                <button onClick={() => toggleModule(perms)} className="text-xs font-medium text-ink hover:underline">
                  {allOn ? 'Clear' : 'Select all'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {perms.map((p) => {
                  const on = selected.has(p.key)
                  return (
                    <button key={p.key} onClick={() => toggle(p.key)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                        on ? 'border-ink bg-ink text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {p.action}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export default function Roles() {
  const { can } = usePermissions()
  const { data: roles = [], isLoading } = useRoles()
  const [editing, setEditing] = useState(undefined) // undefined=closed | null=new | role=edit
  const del = useDeleteRole({ onError: (e) => alert(e.response?.data?.message || 'Could not delete.') })

  const remove = (role) => {
    if (window.confirm(`Delete role "${role.name}"?`)) del.mutate(role.id)
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles &amp; Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">Define what each role can access across the portal.</p>
        </div>
        {can('roles.create') && (
          <button onClick={() => setEditing(null)} className="flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-brand-500">
            <Plus size={18} /> New Role
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-ink">
                  <ShieldCheck size={20} />
                </span>
                {role.is_system && (
                  <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500"><Lock size={12} /> System</span>
                )}
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">{role.name}</h3>
              <p className="mt-0.5 text-sm text-gray-500">{role.description || '—'}</p>
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>{role.permissions_count ?? 0} permissions</span>
                <span>{role.staff_count ?? 0} staff</span>
              </div>
              <div className="mt-4 flex gap-2">
                {can('roles.update') && (
                  <button onClick={() => setEditing(role)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <Pencil size={15} /> Edit
                  </button>
                )}
                {can('roles.delete') && !role.is_system && (
                  <button onClick={() => remove(role)} className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50">
                    <Trash2 size={15} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== undefined && <RoleModal role={editing} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
