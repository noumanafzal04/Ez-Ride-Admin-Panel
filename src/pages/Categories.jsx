import { useState } from 'react'
import { Table } from 'antd'
import { Plus, Pencil, Trash2, Loader2, Tags } from 'lucide-react'
import Modal from '../components/Modal'
import usePermissions from '../hooks/usePermissions'
import { useServiceCategories, useSaveCategory, useDeleteCategory } from '../hooks/useCategories'

function CategoryModal({ category, onClose }) {
  const isEdit = !!category?.id
  const [name, setName] = useState(category?.name || '')
  const [icon, setIcon] = useState(category?.icon || '')
  const [sort, setSort] = useState(category?.sort ?? '')
  const [isActive, setIsActive] = useState(category?.is_active ?? true)
  const [error, setError] = useState('')

  const save = useSaveCategory({ onSuccess: onClose, onError: (e) => setError(e.response?.data?.message || 'Could not save.') })
  const submit = () => {
    setError('')
    if (!name.trim()) { setError('Name is required.'); return }
    const payload = { name: name.trim(), icon: icon.trim() || null, is_active: isActive }
    if (sort !== '') payload.sort = Number(sort)
    save.mutate({ id: category?.id, payload })
  }
  const input = 'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-brand-100'

  return (
    <Modal open onClose={onClose} title={isEdit ? `Edit ${category.name}` : 'New category'}
      footer={
        <>
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={save.isPending} className="flex items-center gap-2 rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand-500 disabled:opacity-60">
            {save.isPending && <Loader2 size={16} className="animate-spin" />} Save
          </button>
        </>
      }>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={input} placeholder="e.g. Car Wash & Detailing" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Icon <span className="text-gray-400">(mobile icon name)</span></label>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} className={input} placeholder="e.g. car-wash" />
          <p className="mt-1 text-xs text-gray-400">MaterialCommunityIcons name used by the app.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Sort</label>
            <input type="number" value={sort} onChange={(e) => setSort(e.target.value)} className={input} placeholder="auto" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label>
            <select value={isActive ? '1' : '0'} onChange={(e) => setIsActive(e.target.value === '1')} className={input}>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function Categories() {
  const { can } = usePermissions()
  const { data: categories = [], isLoading } = useServiceCategories()
  const [editing, setEditing] = useState(undefined)
  const save = useSaveCategory()
  const del = useDeleteCategory({ onError: (e) => alert(e.response?.data?.message || 'Could not delete.') })

  const toggle = (c) => can('categories.update') && save.mutate({ id: c.id, payload: { is_active: !c.is_active } })
  const remove = (c) => { if (window.confirm(`Delete "${c.name}"?`)) del.mutate(c.id) }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
          <p className="mt-1 text-sm text-gray-500">Categories providers can offer (mechanic, car wash, AC…).</p>
        </div>
        {can('categories.create') && (
          <button onClick={() => setEditing(null)} className="flex items-center gap-2 rounded-xl bg-brand-400 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-brand-500">
            <Plus size={18} /> New Category
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-2">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={categories}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} categories` }}
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: 'Category', dataIndex: 'name',
              render: (_, c) => (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-ink"><Tags size={16} /></span>
                  <div>
                    <p className="font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.slug}</p>
                  </div>
                </div>
              ),
            },
            { title: 'Icon', dataIndex: 'icon', width: 160, render: (icon) => <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{icon || '—'}</code> },
            { title: 'Providers', dataIndex: 'providers_count', width: 110, render: (n) => n ?? 0 },
            {
              title: 'Status', width: 120,
              render: (_, c) => (
                <button onClick={() => toggle(c)} disabled={!can('categories.update')}
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${c.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'} ${can('categories.update') ? 'cursor-pointer' : ''}`}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </button>
              ),
            },
            {
              title: 'Actions', align: 'right', width: 110,
              render: (_, c) => (
                <div className="flex justify-end gap-2">
                  {can('categories.update') && <button onClick={() => setEditing(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Pencil size={17} /></button>}
                  {can('categories.delete') && <button onClick={() => remove(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>}
                </div>
              ),
            },
          ]}
        />
      </div>

      {editing !== undefined && <CategoryModal category={editing} onClose={() => setEditing(undefined)} />}
    </div>
  )
}
