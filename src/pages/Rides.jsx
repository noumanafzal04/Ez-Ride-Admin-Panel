import { useState, useEffect } from 'react'
import { Table, Select, Input, Button, Popconfirm, Tooltip, App } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { Ban, MapPin, Users as UsersIcon, Route as RouteIcon, Activity, CheckCircle2, XCircle, Download } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'
import { StatCard, StatCards } from '../components/StatCard'
import StatusPill from '../components/StatusPill'
import { FilterBar, FilterGroup } from '../components/FilterBar'
import adminService from '../services/adminService'
import { useRides, useRideStats, useCancelRide } from '../hooks/useRides'

const STATUS_TONE = { active: 'blue', in_progress: 'amber', completed: 'green', cancelled: 'red' }
const fmtDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
const fmtPrice = (p) => (p == null ? '—' : `Rs ${Number(p).toLocaleString('en-PK')}`)

const exportCsv = (rows) => {
  const head = ['ID', 'From', 'To', 'Driver', 'Phone', 'Departure', 'Type', 'Bookings', 'Price', 'Status']
  const body = rows.map((r) => [r.id, r.from_city, r.to_city, r.driver?.name, r.driver?.phone, r.departure_at, r.post_type, r.bookings_count, r.price_per_seat, r.status])
  const csv = [head, ...body].map((r) => r.map((c) => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'rides.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function Rides() {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const [status, setStatus] = useState('')
  const [cityId, setCityId] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  useEffect(() => { setPage(1) }, [status, cityId, search])

  const { data: cities = [] } = useQuery({
    queryKey: ['admin-cities'], staleTime: 36e5,
    queryFn: () => adminService.cities().then((r) => r.data?.data?.cities || []),
  })

  const filters = {}
  if (status) filters.status = status
  if (cityId) filters.city_id = cityId
  if (search.trim()) filters.search = search.trim()

  const { data, isFetching, refetch } = useRides({ page, perPage: pageSize, ...filters })
  const { data: stats = {} } = useRideStats()
  const rows = data?.rows || []
  const total = data?.total || 0

  const canCancel = can('rides.update')
  const cancel = useCancelRide({
    onSuccess: () => message.success('Ride cancelled'),
    onError: (e) => message.error(e.response?.data?.message || 'Could not cancel ride.'),
  })

  const columns = [
    {
      title: 'Route', dataIndex: 'from_city',
      render: (_, r) => (
        <div className="flex items-center gap-2 text-gray-800">
          <MapPin size={14} className="text-gray-400" />
          <span className="font-medium">{r.from_city || '—'}</span>
          <span className="text-gray-300">→</span>
          <span className="font-medium">{r.to_city || '—'}</span>
        </div>
      ),
    },
    {
      title: 'Driver', width: 190,
      render: (_, r) => (
        <div>
          <p className="font-medium text-gray-800">{r.driver?.name || '—'}</p>
          <p className="text-xs text-gray-400">{r.driver?.phone || ''}</p>
        </div>
      ),
    },
    { title: 'Departure', dataIndex: 'departure_at', width: 150, render: fmtDateTime },
    {
      title: 'Type', dataIndex: 'post_type', width: 100,
      render: (t) => <StatusPill tone={t === 'private' ? 'violet' : 'blue'}>{t || '—'}</StatusPill>,
    },
    {
      title: 'Bookings', dataIndex: 'bookings_count', width: 100, align: 'center',
      render: (n) => <span className="inline-flex items-center gap-1 text-gray-700"><UsersIcon size={13} className="text-gray-400" />{n ?? 0}</span>,
    },
    { title: 'Price', dataIndex: 'price_per_seat', width: 110, render: fmtPrice },
    {
      title: 'Status', dataIndex: 'status', width: 130,
      render: (s) => <StatusPill tone={STATUS_TONE[s] || 'gray'}>{(s || '').replace('_', ' ')}</StatusPill>,
    },
    {
      title: '', align: 'right', width: 70,
      render: (_, r) => {
        if (!canCancel) return null
        const closed = r.status === 'completed' || r.status === 'cancelled'
        if (closed) return <span className="text-gray-300">—</span>
        const busy = cancel.isPending && cancel.variables === r.id
        return (
          <Popconfirm
            title="Cancel this ride?"
            description="Active bookings will be cancelled and the driver + riders notified."
            okText="Cancel ride" okButtonProps={{ danger: true }}
            onConfirm={() => cancel.mutate(r.id)}
          >
            <Tooltip title="Cancel ride"><Button size="small" type="text" danger icon={<Ban size={17} />} loading={busy} /></Tooltip>
          </Popconfirm>
        )
      },
    },
  ]

  return (
    <div className="w-full">
      <PageHeader
        title="Rides"
        subtitle="Browse posted rides and cancel one if needed."
        onRefresh={refetch}
        refreshing={isFetching}
        actions={
          <Tooltip title="Export CSV">
            <Button icon={<Download size={16} />} onClick={() => exportCsv(rows)} />
          </Tooltip>
        }
      />

      <StatCards>
        <StatCard tone="violet" label="Total rides" value={stats.total} icon={RouteIcon} />
        <StatCard tone="blue" label="Active" value={stats.active} icon={Activity} />
        <StatCard tone="teal" label="Completed" value={stats.completed} icon={CheckCircle2} />
        <StatCard tone="rose" label="Cancelled" value={stats.cancelled} icon={XCircle} />
      </StatCards>

      <FilterBar
        search={
          <Input.Search size="large" allowClear placeholder="Search by driver name or phone…"
            onSearch={setSearch} onChange={(e) => !e.target.value && setSearch('')} />
        }
      >
        <FilterGroup>
          <Select size="large" value={status} onChange={setStatus}
            options={[
              { label: 'All statuses', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'In progress', value: 'in_progress' },
              { label: 'Completed', value: 'completed' },
              { label: 'Cancelled', value: 'cancelled' },
            ]} />
        </FilterGroup>
        <FilterGroup>
          <Select size="large" allowClear showSearch optionFilterProp="label" placeholder="Any city"
            value={cityId} onChange={(v) => setCityId(v ?? null)}
            options={cities.map((c) => ({ value: c.id, label: c.name }))} />
        </FilterGroup>
      </FilterBar>

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <Table
          rowKey="id"
          rowSelection={{ type: 'checkbox' }}
          loading={isFetching}
          columns={columns}
          dataSource={rows}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true,
            showTotal: (t) => `${t} rides`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </div>
    </div>
  )
}
