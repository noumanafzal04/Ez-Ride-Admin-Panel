import { useState, useEffect } from 'react'
import { Table, Switch, Modal, InputNumber, Tag, Select, Button, Popconfirm, Tooltip, App } from 'antd'
import { BadgeCheck, XCircle, CheckCircle2, Tag as TagIcon, ShieldCheck, ClipboardCheck, Download } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { FilterBar, FilterGroup } from '../components/FilterBar'
import config from '../config'
import {
  useListings, useSetListingStatus, useSetListingPrice, useSetListingFeatured,
} from '../hooks/useListings'

const STORAGE_BASE = config.BASE_URL.replace(/\/api\/v1\/?$/, '/')
const imgUrl = (path) => (path ? `${STORAGE_BASE}storage/${path}` : null)
const money = (n) => (n == null ? '—' : `Rs. ${Number(n).toLocaleString()}`)
const STATUS_TONE = { active: 'green', pending: 'amber', sold: 'gray', rejected: 'red', draft: 'gray', inactive: 'gray' }
const statusLabel = (s) => (s === 'pending' ? 'In review' : s)

const exportCsv = (rows) => {
  const head = ['ID', 'Title', 'Seller', 'City', 'Type', 'Price', 'Status', 'Featured']
  const body = rows.map((l) => [l.id, l.title, l.seller?.name, l.city?.name, l.is_managed ? 'Managed' : 'Self', l.price, l.status, l.is_featured ? 'Yes' : 'No'])
  const csv = [head, ...body].map((r) => r.map((c) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'listings.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function Listings() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const canManage = can('listings.update')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [priceModal, setPriceModal] = useState(null)
  const [priceVal, setPriceVal] = useState(null)

  useEffect(() => { setPage(1) }, [status, type])

  const { data, isFetching, refetch } = useListings({ page, perPage: pageSize, status, type })
  const rows = data?.rows || []
  const total = data?.total || 0

  const onErr = (e) => message.error(e.response?.data?.message || 'Action failed.')
  const statusMut = useSetListingStatus({ onSuccess: (_r, v) => message.success(`Listing ${v.status === 'active' ? 'approved' : v.status}`), onError: onErr })
  const priceMut = useSetListingPrice({ onSuccess: () => { message.success('Price updated'); setPriceModal(null) }, onError: onErr })
  const featuredMut = useSetListingFeatured({ onSuccess: () => message.success('Updated'), onError: onErr })

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
              : <span className="flex h-12 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-300"><TagIcon size={18} /></span>}
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
        ? <Tag color="gold" icon={<ShieldCheck size={11} className="inline -mt-0.5 mr-1" />}>Managed</Tag>
        : <Tag>Self</Tag>,
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
        ? <Tag color="success" icon={<ClipboardCheck size={11} className="inline -mt-0.5 mr-1" />}>{l.inspection?.grade}</Tag>
        : <span className="text-gray-300">—</span>,
    },
    {
      title: 'Status', dataIndex: 'status', width: 120,
      render: (s) => <StatusPill tone={STATUS_TONE[s] || 'gray'}>{statusLabel(s)}</StatusPill>,
    },
    {
      title: 'Featured', width: 90, align: 'center',
      render: (_, l) => <Switch size="small" checked={!!l.is_featured} disabled={!canManage}
        loading={featuredMut.isPending && featuredMut.variables?.id === l.id}
        onChange={(v) => featuredMut.mutate({ id: l.id, is_featured: v })} />,
    },
    {
      title: '', align: 'right', width: 150,
      render: (_, l) => {
        if (!canManage) return null
        const busy = statusMut.isPending && statusMut.variables?.id === l.id
        return (
          <div className="flex justify-end gap-1.5">
            {(l.status === 'pending' || l.status === 'rejected' || l.status === 'inactive') && (
              <Popconfirm title="Approve & publish this listing?" okText="Approve" onConfirm={() => statusMut.mutate({ id: l.id, status: 'active' })}>
                <Tooltip title="Approve"><Button size="small" type="text" icon={<BadgeCheck size={17} />} loading={busy} className="text-emerald-600!" /></Tooltip>
              </Popconfirm>
            )}
            {l.status === 'active' && (
              <Popconfirm title="Mark this listing as sold?" okText="Mark sold" onConfirm={() => statusMut.mutate({ id: l.id, status: 'sold' })}>
                <Tooltip title="Mark sold"><Button size="small" type="text" icon={<CheckCircle2 size={17} />} loading={busy} className="text-gray-500!" /></Tooltip>
              </Popconfirm>
            )}
            {l.status !== 'rejected' && l.status !== 'sold' && (
              <Popconfirm title="Reject this listing?" okText="Reject" okButtonProps={{ danger: true }} onConfirm={() => statusMut.mutate({ id: l.id, status: 'rejected' })}>
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
        title="Car Listings"
        subtitle="Review managed sales, set prices, approve and feature listings."
        onRefresh={refetch}
        refreshing={isFetching}
        actions={<Tooltip title="Export CSV"><Button icon={<Download size={16} />} onClick={() => exportCsv(rows)} /></Tooltip>}
      />

      <FilterBar>
        <FilterGroup>
          <Select size="large" value={status} onChange={setStatus} options={[
            { label: 'All statuses', value: '' }, { label: 'In review', value: 'pending' }, { label: 'Active', value: 'active' },
            { label: 'Sold', value: 'sold' }, { label: 'Rejected', value: 'rejected' },
          ]} />
        </FilterGroup>
        <FilterGroup>
          <Select size="large" value={type} onChange={setType} options={[
            { label: 'All types', value: '' }, { label: 'EZRide managed', value: 'managed' }, { label: 'Self', value: 'self' },
          ]} />
        </FilterGroup>
      </FilterBar>

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <Table
          rowKey="id"
          loading={isFetching}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true,
            showTotal: (t) => `${t} listings`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
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
