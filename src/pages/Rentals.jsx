import { useState, useEffect } from 'react'
import { Table, Switch, Modal, InputNumber, Tag, Segmented, Button, Popconfirm, App } from 'antd'
import { BadgeCheck, XCircle, PauseCircle, CarFront, ShieldCheck, ClipboardCheck } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import config from '../config'
import { FilterBar, FilterGroup, FilterDivider } from '../components/FilterBar'
import { useRentals, useSetRentalStatus, useSetRentalPrice, useSetRentalFeatured } from '../hooks/useRentals'

const STORAGE_BASE = config.BASE_URL.replace(/\/api\/v1\/?$/, '/')
const imgUrl = (p) => (p ? `${STORAGE_BASE}storage/${p}` : null)
const money = (n) => (n == null ? '—' : `Rs. ${Number(n).toLocaleString()}`)
const STATUS_COLOR = { active: 'success', pending: 'warning', paused: 'default', rejected: 'error', inactive: 'default' }
const RT_LABEL = { with_driver: 'With driver', self_drive: 'Self-drive', both: 'Driver / Self' }

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

  const { data, isFetching } = useRentals({ page, perPage: pageSize, status, type })
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
    { title: 'Status', dataIndex: 'status', width: 110, render: (s) => <Tag color={STATUS_COLOR[s] || 'default'} className="capitalize">{s === 'pending' ? 'In review' : s}</Tag> },
    { title: 'Featured', width: 90, align: 'center', render: (_, r) => <Switch size="small" checked={!!r.is_featured} disabled={!canManage} loading={featuredMut.isPending && featuredMut.variables?.id === r.id} onChange={(v) => featuredMut.mutate({ id: r.id, is_featured: v })} /> },
    {
      title: 'Actions', align: 'right', width: 250,
      render: (_, r) => {
        if (!canManage) return null
        const busy = statusMut.isPending && statusMut.variables?.id === r.id
        return (
          <div className="flex justify-end gap-2">
            {(r.status === 'pending' || r.status === 'rejected' || r.status === 'paused' || r.status === 'inactive') && (
              <Popconfirm title="Approve & publish this rental?" okText="Approve" onConfirm={() => statusMut.mutate({ id: r.id, status: 'active' })}>
                <Button size="small" icon={<BadgeCheck size={14} />} loading={busy} className="text-emerald-600! border-emerald-200!">Approve</Button>
              </Popconfirm>
            )}
            {r.status === 'active' && (
              <Popconfirm title="Pause this rental?" okText="Pause" onConfirm={() => statusMut.mutate({ id: r.id, status: 'paused' })}>
                <Button size="small" icon={<PauseCircle size={14} />} loading={busy}>Pause</Button>
              </Popconfirm>
            )}
            {r.status !== 'rejected' && (
              <Popconfirm title="Reject this rental?" okText="Reject" okButtonProps={{ danger: true }} onConfirm={() => statusMut.mutate({ id: r.id, status: 'rejected' })}>
                <Button size="small" danger icon={<XCircle size={14} />} loading={busy}>Reject</Button>
              </Popconfirm>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rent a Car</h1>
        <p className="mt-1 text-sm text-gray-500">Review managed rentals, set daily prices, approve and feature cars.</p>
      </div>

      <FilterBar>
        <FilterGroup label="Status">
          <Segmented size="large" value={status} onChange={setStatus} options={[
            { label: 'All', value: '' }, { label: 'In review', value: 'pending' }, { label: 'Active', value: 'active' },
            { label: 'Paused', value: 'paused' }, { label: 'Rejected', value: 'rejected' },
          ]} />
        </FilterGroup>
        <FilterDivider />
        <FilterGroup label="Listing type">
          <Segmented size="large" value={type} onChange={setType} options={[
            { label: 'All types', value: '' }, { label: 'EZRide managed', value: 'managed' }, { label: 'Self', value: 'self' },
          ]} />
        </FilterGroup>
      </FilterBar>

      <div className="rounded-2xl border border-gray-200 bg-white p-2">
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
