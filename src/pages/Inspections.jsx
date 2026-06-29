import { useState, useEffect } from 'react'
import { Table, Select, Button, Modal, Input, Spin, App } from 'antd'
import { ClipboardCheck } from 'lucide-react'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'
import StatusPill from '../components/StatusPill'
import { FilterBar, FilterGroup } from '../components/FilterBar'
import {
  useInspections, useInspection, useInspectionCategories,
  useUpdateInspectionStatus, useSaveInspectionReport,
} from '../hooks/useInspections'

const STATUSES = ['pending', 'reviewing', 'scheduled', 'in_progress', 'completed', 'cancelled']
const STATUS_TONE = {
  pending: 'blue', reviewing: 'amber', scheduled: 'violet',
  in_progress: 'cyan', completed: 'green', cancelled: 'red',
}
const CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'na']
const carLine = (r) => [r.car_year, r.car_make, r.car_model].filter(Boolean).join(' ') || 'Car inspection'
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
const Badge = ({ s }) => <StatusPill tone={STATUS_TONE[s] || 'gray'}>{(s || '').replace('_', ' ')}</StatusPill>

function InspectionModal({ id, open, onClose }) {
  const { can } = usePermissions()
  const { message } = App.useApp()
  const { data: item, isLoading } = useInspection(id)
  const { data: categories = [] } = useInspectionCategories()
  const canEdit = can('inspections.update')

  const [status, setStatus] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [conditions, setConditions] = useState({})
  const [comments, setComments] = useState('')
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (item && !seeded) {
      setStatus(item.status || '')
      const c = {}
      ;(item.report || []).forEach((r) => { c[r.category_id] = r.condition })
      setConditions(c)
      setComments(item.inspector_comments || '')
      setSeeded(true)
    }
    if (!open) setSeeded(false)
  }, [item, seeded, open])

  const updateStatus = useUpdateInspectionStatus({
    onSuccess: () => message.success('Status updated'),
    onError: (e) => message.error(e.response?.data?.message || 'Failed.'),
  })
  const saveReport = useSaveInspectionReport({
    onSuccess: () => { message.success('Report saved — request completed'); onClose() },
    onError: (e) => message.error(e.response?.data?.message || 'Failed.'),
  })

  const submitStatus = () => {
    const payload = { status }
    if (status === 'scheduled' && scheduledAt) payload.scheduled_at = scheduledAt.replace('T', ' ') + ':00'
    updateStatus.mutate({ id, payload })
  }
  const submitReport = () => {
    const items = categories.filter((c) => conditions[c.id]).map((c) => ({ category_id: c.id, condition: conditions[c.id] }))
    if (!items.length) { message.warning('Rate at least one category.'); return }
    saveReport.mutate({ id, payload: { items, comments: comments.trim() || null } })
  }

  const Info = ({ label, value }) => (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-800">{value || '—'}</span>
    </div>
  )

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={720}
      title={item ? carLine(item) : 'Inspection'}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}>
      {isLoading || !item ? (
        <div className="flex justify-center py-10"><Spin /></div>
      ) : (
        <div className="space-y-5 pt-1">
          <div className="rounded-xl border border-gray-200 p-4">
            <Info label="Requester" value={`${item.name} · ${item.phone}`} />
            {item.email && <Info label="Email" value={item.email} />}
            <Info label="Registration" value={item.registration_no} />
            <Info label="City / Address" value={[item.city?.name, item.address].filter(Boolean).join(' · ')} />
            <Info label="Preferred" value={fmt(item.preferred_at)} />
            {item.notes && <Info label="Notes" value={item.notes} />}
            {item.overall_grade && <Info label="Result" value={`Grade ${item.overall_grade} · ${item.overall_score ?? ''}%`} />}
          </div>

          {canEdit && (
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">Update status</p>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={status} onChange={setStatus} style={{ minWidth: 160 }}
                  options={STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} />
                {status === 'scheduled' && (
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-ink" />
                )}
                <Button type="primary" onClick={submitStatus} loading={updateStatus.isPending}>Update</Button>
              </div>
            </div>
          )}

          {canEdit && (
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-700">Inspection report</p>
              <div className="space-y-2.5">
                {categories.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-gray-700">{c.name}</span>
                    <div className="flex gap-1">
                      {CONDITIONS.map((cond) => {
                        const on = conditions[c.id] === cond
                        return (
                          <button key={cond} onClick={() => setConditions((p) => ({ ...p, [c.id]: cond }))}
                            className={`rounded-md border px-2 py-1 text-xs font-medium capitalize ${on ? 'border-ink bg-ink text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            {cond === 'na' ? 'N/A' : cond}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <Input.TextArea value={comments} onChange={(e) => setComments(e.target.value)} rows={2}
                placeholder="Overall comments (shown to requester)" className="mt-3" />
              <Button type="primary" onClick={submitReport} loading={saveReport.isPending}
                className="mt-3" style={{ background: '#FFD400', color: '#07163b', fontWeight: 600 }}>
                Save Report &amp; Complete
              </Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default function Inspections() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [openId, setOpenId] = useState(null)

  useEffect(() => { setPage(1) }, [status])

  const { data, isFetching, refetch } = useInspections({ page, perPage: pageSize, status })
  const rows = data?.rows || []
  const total = data?.total || 0

  const columns = [
    {
      title: 'Car', render: (_, r) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-ink"><ClipboardCheck size={16} /></span>
          <span className="font-medium text-gray-800">{carLine(r)}</span>
        </div>
      ),
    },
    { title: 'Requester', dataIndex: 'name', render: (n) => <span className="text-gray-600">{n}</span> },
    { title: 'City', width: 120, render: (_, r) => <span className="text-gray-600">{r.city?.name || '—'}</span> },
    { title: 'Status', dataIndex: 'status', width: 130, render: (s) => <Badge s={s} /> },
    { title: 'Requested', dataIndex: 'created_at', width: 160, render: fmt },
    {
      title: '', align: 'right', width: 110,
      render: (_, r) => <Button size="small" onClick={() => setOpenId(r.id)}>Manage</Button>,
    },
  ]

  return (
    <div className="w-full">
      <PageHeader
        title="Inspections"
        subtitle="Manage car-inspection requests and reports."
        onRefresh={refetch}
        refreshing={isFetching}
      />

      <FilterBar>
        <FilterGroup>
          <Select size="large" value={status} onChange={setStatus}
            options={[{ label: 'All statuses', value: '' }, ...STATUSES.map((s) => ({ label: s.replace('_', ' '), value: s }))]} />
        </FilterGroup>
      </FilterBar>

      <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <Table
          rowKey="id"
          loading={isFetching}
          dataSource={rows}
          columns={columns}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true,
            showTotal: (t) => `${t} requests`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </div>

      <InspectionModal id={openId} open={!!openId} onClose={() => setOpenId(null)} />
    </div>
  )
}
