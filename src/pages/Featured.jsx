import { useState, useEffect } from 'react'
import { Table, Select, InputNumber, Switch, Button, App } from 'antd'
import { Car, CarFront, Star } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { FilterBar, FilterGroup } from '../components/FilterBar'
import { useFeatureOrders, useFeatureSettings, useUpdateFeatureSetting } from '../hooks/useFeatures'

const MODULE_META = {
  buysell: { label: 'Buy / Sell', icon: Car, tone: 'orange' },
  rental: { label: 'Rent a Car', icon: CarFront, tone: 'rose' },
}
const fmtMoney = (n) => (n == null ? '—' : `Rs ${Number(n).toLocaleString('en-PK')}`)
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

function SettingCard({ s, canEdit }) {
  const { message } = App.useApp()
  const [price, setPrice] = useState(s.price)
  const [days, setDays] = useState(s.duration_days)
  const [active, setActive] = useState(s.is_active)
  useEffect(() => { setPrice(s.price); setDays(s.duration_days); setActive(s.is_active) }, [s])

  const save = useUpdateFeatureSetting({
    onSuccess: () => message.success(`${MODULE_META[s.module]?.label || s.module} feature price updated`),
    onError: (e) => message.error(e.response?.data?.message || 'Could not update.'),
  })
  const meta = MODULE_META[s.module] || { label: s.module, icon: Star }
  const Icon = meta.icon
  const dirty = price !== s.price || days !== s.duration_days || active !== s.is_active

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-ink"><Icon size={20} /></span>
          <h3 className="font-semibold text-ink">{meta.label}</h3>
        </div>
        <StatusPill tone={active ? 'green' : 'gray'}>{active ? 'On sale' : 'Off'}</StatusPill>
      </div>
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Price (Rs)</p>
          <InputNumber className="w-full!" min={0} value={price} onChange={(v) => setPrice(v ?? 0)} disabled={!canEdit}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v.replace(/[^\d]/g, '')} />
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Duration (days)</p>
          <InputNumber className="w-full!" min={1} max={365} value={days} onChange={(v) => setDays(v ?? 1)} disabled={!canEdit} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Available to buy</span>
          <Switch checked={active} onChange={setActive} disabled={!canEdit} />
        </div>
        {canEdit && (
          <Button type="primary" block disabled={!dirty} loading={save.isPending}
            onClick={() => save.mutate({ module: s.module, payload: { price, duration_days: days, is_active: active } })}>
            Save
          </Button>
        )}
      </div>
    </div>
  )
}

export default function Featured() {
  const { can } = usePermissions()
  const canEdit = can('billing.update')
  const [module, setModule] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  useEffect(() => { setPage(1) }, [module])

  const { data: settings = [], isLoading: loadingSettings } = useFeatureSettings()
  const { data, isFetching, refetch } = useFeatureOrders({ page, perPage: pageSize, ...(module ? { module } : {}) })
  const rows = data?.rows || []
  const total = data?.total || 0

  const columns = [
    { title: 'Item', dataIndex: 'item', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    {
      title: 'Module', dataIndex: 'module', width: 120,
      render: (m) => <StatusPill tone={MODULE_META[m]?.tone || 'gray'}>{MODULE_META[m]?.label || m}</StatusPill>,
    },
    {
      title: 'Buyer', width: 190,
      render: (_, o) => (<div><p className="font-medium text-gray-800">{o.user}</p><p className="text-xs text-gray-400">{o.phone || ''}</p></div>),
    },
    { title: 'Amount', dataIndex: 'amount', width: 110, render: fmtMoney },
    { title: 'Days', dataIndex: 'days', width: 80, align: 'center' },
    { title: 'Status', dataIndex: 'status', width: 100, render: (s) => <StatusPill tone={s === 'paid' ? 'green' : 'amber'}>{s}</StatusPill> },
    { title: 'Expires', dataIndex: 'expires_at', width: 130, render: fmtDate },
    { title: 'Paid', dataIndex: 'paid_at', width: 130, render: fmtDate },
  ]

  return (
    <div className="w-full">
      <PageHeader title="Featured" subtitle="Paid boosts for Buy/Sell + Rent-a-Car listings." onRefresh={refetch} refreshing={isFetching} />

      {/* Pricing settings */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loadingSettings
          ? <div className="text-sm text-gray-400">Loading pricing…</div>
          : settings.map((s) => <SettingCard key={s.module} s={s} canEdit={canEdit} />)}
      </div>

      <FilterBar>
        <FilterGroup>
          <Select size="large" value={module} onChange={setModule} options={[
            { label: 'All modules', value: '' },
            { label: 'Buy / Sell', value: 'buysell' },
            { label: 'Rent a Car', value: 'rental' },
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
            showTotal: (t) => `${t} feature orders`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </div>
    </div>
  )
}
