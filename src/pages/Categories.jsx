import { useState, useEffect } from 'react'
import { Table, Modal, Form, Input, InputNumber, Switch, Button, Popconfirm, App } from 'antd'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'
import { useServiceCategories, useSaveCategory, useDeleteCategory } from '../hooks/useCategories'

function CategoryModal({ category, open, onClose }) {
  const isEdit = !!category?.id
  const [form] = Form.useForm()
  const { message } = App.useApp()

  const save = useSaveCategory({
    onSuccess: () => { message.success(isEdit ? 'Category updated' : 'Category created'); onClose() },
    onError: (e) => message.error(e.response?.data?.message || 'Could not save.'),
  })

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        name: category?.name || '',
        icon: category?.icon || '',
        sort: category?.sort ?? null,
        is_active: category?.is_active ?? true,
      })
    }
  }, [open, category, form])

  const submit = async () => {
    const v = await form.validateFields()
    const payload = { name: v.name.trim(), icon: v.icon?.trim() || null, is_active: v.is_active }
    if (v.sort !== null && v.sort !== undefined && v.sort !== '') payload.sort = Number(v.sort)
    save.mutate({ id: category?.id, payload })
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit ${category.name}` : 'New category'}
      onCancel={onClose}
      onOk={submit}
      okText="Save"
      confirmLoading={save.isPending}
      okButtonProps={{ style: { background: '#FFD400', color: '#07163b', fontWeight: 600 } }}
    >
      <Form form={form} layout="vertical" requiredMark className="pt-2">
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }, { max: 100 }]}>
          <Input placeholder="e.g. Car Wash & Detailing" />
        </Form.Item>
        <Form.Item name="icon" label="Icon" extra="MaterialCommunityIcons name used by the app (e.g. car-wash).">
          <Input placeholder="e.g. car-wash" />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item name="sort" label="Sort order">
            <InputNumber className="w-full" min={0} placeholder="auto" />
          </Form.Item>
          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  )
}

export default function Categories() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const { data: categories = [], isLoading } = useServiceCategories()
  const [editing, setEditing] = useState(undefined) // undefined=closed, null=new, obj=edit

  const save = useSaveCategory({
    onSuccess: () => message.success('Status updated'),
    onError: (e) => message.error(e.response?.data?.message || 'Could not update.'),
  })
  const del = useDeleteCategory({
    onSuccess: () => message.success('Category deleted'),
    onError: (e) => message.error(e.response?.data?.message || 'Could not delete.'),
  })

  const canUpdate = can('categories.update')
  const toggle = (c) => canUpdate && save.mutate({ id: c.id, payload: { is_active: !c.is_active } })

  const columns = [
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
      render: (_, c) => <Switch size="small" checked={!!c.is_active} disabled={!canUpdate} loading={save.isPending && save.variables?.id === c.id} onChange={() => toggle(c)} />,
    },
    {
      title: 'Actions', align: 'right', width: 110,
      render: (_, c) => (
        <div className="flex justify-end gap-1">
          {canUpdate && <Button type="text" icon={<Pencil size={16} />} onClick={() => setEditing(c)} />}
          {can('categories.delete') && (
            <Popconfirm title={`Delete "${c.name}"?`} okText="Delete" okButtonProps={{ danger: true }} onConfirm={() => del.mutate(c.id)}>
              <Button type="text" danger icon={<Trash2 size={16} />} loading={del.isPending && del.variables === c.id} />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="w-full">
      <PageHeader
        title="Service Categories"
        subtitle="Categories providers can offer (mechanic, car wash, AC…)."
        actions={can('categories.create') && (
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setEditing(null)}>New Category</Button>
        )}
      />

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={categories}
          columns={columns}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} categories` }}
        />
      </div>

      <CategoryModal category={editing} open={editing !== undefined} onClose={() => setEditing(undefined)} />
    </div>
  )
}
