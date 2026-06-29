import { useState, useEffect } from 'react'
import { Table, Switch, Modal, InputNumber, Tag, Select, Button, Popconfirm, Tooltip, App } from 'antd'
import { BadgeCheck, XCircle, PauseCircle, CarFront, ShieldCheck, ClipboardCheck, Download } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import config from '../config'
import { FilterBar, FilterGroup } from '../components/FilterBar'
import { useRentals, useSetRentalStatus, useSetRentalPrice, useSetRentalFeatured } from '../hooks/useRentals'

const STORAGE_BASE = config.BASE_URL.replace(/\/api\/v1\/?$/, '/')
const imgUrl = (p) => (p ? `${STORAGE_BASE}storage/${p}` : null)
const money = (n) => (n == null ? '—' : `Rs. ${Number(n).toLocaleString()}`)
const STATUS_TONE = { active: 'green', pending: 'amber', paused: 'gray', rejected: 'red', inactive: 'gray' }
const statusLabel = (s) => (s === 'pending' ? 'In review' : s)
const RT_LABEL = { with_driver: 'With driver', self_drive: 'Self-drive', both: 'Driver / Self' }

const exportCsv = (rows) => {
  const head = ['ID', 'Title', 'Owner', 'City', 'Type', 'Rental', 'Price/day', 'Status', 'Featured']
  const body = rows.map((r) => [r.id, r.title, r.owner?.name, r.city?.name, r.is_managed ? 'Managed' : 'Self', RT_LABEL[r.rental_type] || r.rental_type, r.price_per_day, r.status, r.is_featured ? 'Yes' : 'No'])
  const csv = [head, ...body].map((r) => r.map((c) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'rentals.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function Rentals() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const canManage = can('rentals.update')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [priceModal, setPriceModal] = useState(null)
  const [priceVal, setPriceVal] = useState(null)

  useEffect(() => { setPage(1) }, [status, type])

  const { data, isFetching, refetch } = useRentals({ page, perPage: pageSize, status, type })
  const rows = data?.rows || []
  const total = data?.total || 0

  const onErr = (e) => message.error(e.response?.data?.message || 'Action failed.')
  const statusMut = useSetRentalStatus({ onSuccess: (_r, v) => message.success(`Rental ${v.status === 'active' ? 'approved' : v.status}`), onError: onErr })
  const priceMut = useSetRentalPrice({ onSuccess: () => { message.success('Price updated'); setPriceModal(null) }, onError: onErr })
  const featuredMut = useSetRentalFeatured({ onSuccess: () => message.success('Updated'), onError: onErr })

  const openPrice = (r) => { setPriceVal(r.price_per_day ?? null); setPriceModal({ rental: r }) }
  const savePrice = () => { if (priceVal == null || priceVal < 0) return message.warning('Enter a valid price'); priceMut.mutate({ id: priceModal.rental.id, price: priceVal }) }

  const columns = [
    {
      title: 'Car', dataIndex: 'title',
      render: (_, r) => {
        const img = imgUrl(r.primary_image)
        return (
          <div className="flex items-center gap-3">
            {img ? <img src={img} alt="" className="h-12 w-16 rounded-lg object-cover" /> : <span className="flex h-12 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-300"><CarFront size={18} /></span>}
            <div>
              <p className="font-medium text-gray-800">{r.title}</p>
              <p className="text-xs text-gray-400">{r.owner?.name || '—'}{r.city?.name ? ` · ${r.city.name}` : ''}</p>
            </div>
          </div>
        )
      },
    },
    { title: 'Type', width: 120, render: (_, r) => r.is_managed ? <Tag color="gold" icon={<ShieldCheck size={11} className="inline -mt-0.5 mr-1" />}>Managed</Tag> : <Tag>Self</Tag> },
    { title: 'Rental', width: 130, render: (_, r) => <span className="text-gray-600">{RT_LABEL[r.rental_type] || r.rental_type}</span> },
    {
      title: 'Price/day', dataIndex: 'price_per_day', width: 140,
      render: (_, r) => (
        <button disabled={!canManage} onClick={() => openPrice(r)}
          className={`text-left ${canManage ? 'cursor-pointer hover:text-ink' : ''} ${r.price_per_day == null ? 'font-medium text-amber-600' : 'font-semibold text-gray-800'}`}>
          {r.price_per_day == null ? 'Set price' : money(r.price_per_day)}
        </button>
      ),
    },
    { title: 'Inspected', width: 100, align: 'center', render: (_, r) => r.is_inspected ? <Tag color="success" icon={<ClipboardCheck size={11} className="inline -mt-0.5 mr-1" />}>{r.inspection?.grade}</Tag> : <span className="text-gray-300">—</span> },
    { title: 'Status', dataIndex: 'status', width: 120, render: (s) => <StatusPill tone={STATUS_TONE[s] || 'gray'}>{statusLabel(s)}</StatusPill> },
    { title: 'Featured', width: 90, align: 'center', render: (_, r) => <Switch size="small" checked={!!r.is_featured} disabled={!canManage} loading={featuredMut.isPending && featuredMut.variables?.id === r.id} onChange={(v) => featuredMut.mutate({ id: r.id, is_featured: v })} /> },
    {
      title: '', align: 'right', width: 150,
      render: (_, r) => {
        if (!canManage) return null
        const busy = statusMut.isPending && statusMut.variables?.id === r.id
        return (
          <div className="flex justify-end gap-1.5">
            {(r.status === 'pending' || r.status === 'rejected' || r.status === 'paused' || r.status === 'inactive') && (
              <Popconfirm title="Approve & publish this rental?" okText="Approve" onConfirm={() => statusMut.mutate({ id: r.id, status: 'active' })}>
                <Tooltip title="Approve"><Button size="small" type="text" icon={<BadgeCheck size={17} />} loading={busy} className="text-emerald-600!" /></Tooltip>
              </Popconfirm>
            )}
            {r.status === 'active' && (
              <Popconfirm title="Pause this rental?" okText="Pause" onConfirm={() => statusMut.mutate({ id: r.id, status: 'paused' })}>
                <Tooltip title="Pause"><Button size="small" type="text" icon={<PauseCircle size={17} />} loading={busy} className="text-amber-600!" /></Tooltip>
              </Popconfirm>
            )}
            {r.status !== 'rejected' && (
              <Popconfirm title="Reject this rental?" okText="Reject" okButtonProps={{ danger: true }} onConfirm={() => statusMut.mutate({ id: r.id, status: 'rejected' })}>
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
        title="Rent a Car"
        subtitle="Review managed rentals, set daily prices, approve and feature cars."
        onRefresh={refetch}
        refreshing={isFetching}
        actions={<Tooltip title="Export CSV"><Button icon={<Download size={16} />} onClick={() => exportCsv(rows)} /></Tooltip>}
      />

      <FilterBar>
        <FilterGroup>
          <Select size="large" value={status} onChange={setStatus} options={[
            { label: 'All statuses', value: '' }, { label: 'In review', value: 'pending' }, { label: 'Active', value: 'active' },
            { label: 'Paused', value: 'paused' }, { label: 'Rejected', value: 'rejected' },
          ]} />
        </FilterGroup>
        <FilterGroup>
          <Select size="large" value={type} onChange={setType} options={[
            { label: 'All types', value: '' }, { label: 'EZRide managed', value: 'managed' }, { label: 'Self', value: 'self' },
          ]} />
        </FilterGroup>
      </FilterBar>

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <Table rowKey="id" loading={isFetching} columns={columns} dataSource={rows} scroll={{ x: 'max-content' }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (t) => `${t} rentals`, onChange: (p, ps) => { setPage(p); setPageSize(ps) } }} />
      </div>

      <Modal open={!!priceModal} title={priceModal ? `Daily price — ${priceModal.rental.title}` : ''} onCancel={() => setPriceModal(null)} onOk={savePrice}
        okText="Save price" confirmLoading={priceMut.isPending} okButtonProps={{ style: { background: '#FFD400', color: '#07163b', fontWeight: 600 } }}>
        <InputNumber className="w-full" size="large" prefix="Rs." min={0} value={priceVal} onChange={setPriceVal}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v.replace(/[^\d]/g, '')} placeholder="Price per day" />
      </Modal>
    </div>
  )
}
