import { useState } from 'react'
import { Table, Switch, Modal, InputNumber, message } from 'antd'
import { BadgeCheck, XCircle, CheckCircle2, Tag, Loader2, ShieldCheck, ClipboardCheck } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import config from '../config'
import {
  useListings, useSetListingStatus, useSetListingPrice, useSetListingFeatured,
} from '../hooks/useListings'

const STORAGE_BASE = config.BASE_URL.replace(/\/api\/v1\/?$/, '/')
const imgUrl = (path) => (path ? `${STORAGE_BASE}storage/${path}` : null)
const money = (n) => (n == null ? '—' : `Rs. ${Number(n).toLocaleString()}`)

const STATUS_FILTERS = [
  { key: '', label: 'All' }, { key: 'pending', label: 'In review' }, { key: 'active', label: 'Active' },
  { key: 'sold', label: 'Sold' }, { key: 'rejected', label: 'Rejected' },
]
const TYPE_FILTERS = [{ key: '', label: 'All types' }, { key: 'managed', label: 'EZRide managed' }, { key: 'self', label: 'Self' }]
const STATUS_STYLE = {
  active: 'bg-emerald-50 text-emerald-600', pending: 'bg-amber-50 text-amber-600',
  sold: 'bg-gray-100 text-gray-500', rejected: 'bg-red-50 text-red-600',
  draft: 'bg-gray-100 text-gray-500', inactive: 'bg-gray-100 text-gray-500',
}

export default function Listings() {
  const { can } = usePermissions()
  const canManage = can('listings.update')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [priceModal, setPriceModal] = useState(null) // { listing }
  const [priceVal, setPriceVal] = useState(null)

  const { data: listings = [], isLoading } = useListings(status, type)
  const onErr = (e) => message.error(e.response?.data?.message || 'Action failed.')
  const statusMut = useSetListingStatus({ onError: onErr })
  const priceMut = useSetListingPrice({ onSuccess: () => { message.success('Price updated'); setPriceModal(null) }, onError: onErr })
  const featuredMut = useSetListingFeatured({ onError: onErr })

  const openPrice = (l) => { setPriceVal(l.price ?? null); setPriceModal({ listing: l }) }
  const savePrice = () => {
    if (priceVal == null || priceVal < 0) return message.warning('Enter a valid price')
    priceMut.mutate({ id: priceModal.listing.id, price: priceVal })
  }

  const columns = [
    {
      title: 'Car', dataIndex: 'title',
      render: (_, l) => {
        const img = imgUrl(l.primary_image)
        return (
          <div className="flex items-center gap-3">
            {img
              ? <img src={img} alt="" className="h-12 w-16 rounded-lg object-cover" />
              : <span className="flex h-12 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-300"><Tag size={18} /></span>}
            <div>
              <p className="font-medium text-gray-800">{l.title}</p>
              <p className="text-xs text-gray-400">{l.seller?.name || '—'}{l.city?.name ? ` · ${l.city.name}` : ''}</p>
            </div>
          </div>
        )
      },
    },
    {
      title: 'Type', dataIndex: 'listing_type', width: 130,
      render: (_, l) => l.is_managed
        ? <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-ink"><ShieldCheck size={13} /> Managed</span>
        : <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">Self</span>,
    },
    {
      title: 'Price', dataIndex: 'price', width: 150,
      render: (_, l) => (
        <button disabled={!canManage} onClick={() => openPrice(l)}
          className={`text-left ${canManage ? 'cursor-pointer hover:text-ink' : ''} ${l.price == null ? 'font-medium text-amber-600' : 'font-semibold text-gray-800'}`}>
          {l.price == null ? 'Set price' : money(l.price)}
        </button>
      ),
    },
    {
      title: 'Inspected', width: 110, align: 'center',
      render: (_, l) => l.is_inspected
        ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600"><ClipboardCheck size={12} /> {l.inspection?.grade}</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      title: 'Status', dataIndex: 'status', width: 110,
      render: (s) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[s] || 'bg-gray-100 text-gray-500'}`}>{s === 'pending' ? 'In review' : s}</span>,
    },
    {
      title: 'Featured', width: 90, align: 'center',
      render: (_, l) => <Switch size="small" checked={!!l.is_featured} disabled={!canManage}
        onChange={(v) => featuredMut.mutate({ id: l.id, is_featured: v })} />,
    },
    {
      title: 'Actions', align: 'right', width: 240,
      render: (_, l) => {
        if (!canManage) return null
        const busy = statusMut.isPending && statusMut.variables?.id === l.id
        return (
          <div className="flex justify-end gap-2">
            {(l.status === 'pending' || l.status === 'rejected' || l.status === 'inactive') && (
              <button disabled={busy} onClick={() => statusMut.mutate({ id: l.id, status: 'active' })}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 disabled:opacity-50">
                {busy ? <Loader2 size={15} className="animate-spin" /> : <BadgeCheck size={15} />} Approve
              </button>
            )}
            {l.status === 'active' && (
              <button disabled={busy} onClick={() => statusMut.mutate({ id: l.id, status: 'sold' })}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                <CheckCircle2 size={15} /> Sold
              </button>
            )}
            {l.status !== 'rejected' && l.status !== 'sold' && (
              <button disabled={busy} onClick={() => statusMut.mutate({ id: l.id, status: 'rejected' })}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">
                <XCircle size={15} /> Reject
              </button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Car Listings</h1>
        <p className="mt-1 text-sm text-gray-500">Review managed sales, set prices, approve and feature listings.</p>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button key={f.key} onClick={() => setStatus(f.key)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${status === f.key ? 'bg-ink text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f.label}</button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((f) => (
          <button key={f.key} onClick={() => setType(f.key)} className={`rounded-full px-3 py-1.5 text-sm font-medium ${type === f.key ? 'bg-brand-400 text-ink' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f.label}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-2">
        <Table
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={listings}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} listings` }}
          scroll={{ x: 'max-content' }}
        />
      </div>

      <Modal
        open={!!priceModal}
        title={priceModal ? `Set price — ${priceModal.listing.title}` : ''}
        onCancel={() => setPriceModal(null)}
        onOk={savePrice}
        okText="Save price"
        confirmLoading={priceMut.isPending}
        okButtonProps={{ style: { background: '#FFD400', color: '#07163b', fontWeight: 600 } }}
      >
        <InputNumber
          className="w-full"
          size="large"
          prefix="Rs."
          min={0}
          value={priceVal}
          onChange={setPriceVal}
          formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(v) => v.replace(/[^\d]/g, '')}
          placeholder="Enter sale price"
        />
      </Modal>
    </div>
  )
}
