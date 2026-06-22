import { useState, useEffect } from 'react'
import { Table } from 'antd'
import { Loader2, ClipboardCheck } from 'lucide-react'
import Modal from '../components/Modal'
import usePermissions from '../hooks/usePermissions'
import {
  useInspections, useInspection, useInspectionCategories,
  useUpdateInspectionStatus, useSaveInspectionReport,
} from '../hooks/useInspections'

const STATUSES = ['pending', 'reviewing', 'scheduled', 'in_progress', 'completed', 'cancelled']
const STATUS_STYLE = {
  pending: 'bg-blue-50 text-blue-600', reviewing: 'bg-amber-50 text-amber-600',
  scheduled: 'bg-violet-50 text-violet-600', in_progress: 'bg-teal-50 text-teal-600',
  completed: 'bg-emerald-50 text-emerald-600', cancelled: 'bg-red-50 text-red-600',
}
const CONDITIONS = ['excellent', 'good', 'fair', 'poor', 'na']
const carLine = (r) => [r.car_year, r.car_make, r.car_model].filter(Boolean).join(' ') || 'Car inspection'
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')
const Badge = ({ s }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLE[s] || 'bg-gray-100 text-gray-500'}`}>{(s || '').replace('_', ' ')}</span>

function InspectionModal({ id, onClose }) {
  const { can } = usePermissions()
  const { data: item } = useInspection(id)
  const { data: categories = [] } = useInspectionCategories()
  const canEdit = can('inspections.update')

  const [status, setStatus] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [conditions, setConditions] = useState({})
  const [comments, setComments] = useState('')
  const [seeded, setSeeded] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (item && !seeded) {
      setStatus(item.status || '')
      const c = {}
      ;(item.report || []).forEach((r) => { c[r.category_id] = r.condition })
      setConditions(c)
      setComments(item.inspector_comments || '')
      setSeeded(true)
    }
  }, [item, seeded])

  const updateStatus = useUpdateInspectionStatus({ onSuccess: () => setMsg('Status updated.'), onError: (e) => setMsg(e.response?.data?.message || 'Failed.') })
  const saveReport = useSaveInspectionReport({ onSuccess: () => { setMsg('Report saved — request completed.'); }, onError: (e) => setMsg(e.response?.data?.message || 'Failed.') })

  const submitStatus = () => {
    const payload = { status }
    if (status === 'scheduled' && scheduledAt) payload.scheduled_at = scheduledAt.replace('T', ' ') + ':00'
    updateStatus.mutate({ id, payload })
  }
  const submitReport = () => {
    const items = categories
      .filter((c) => conditions[c.id])
      .map((c) => ({ category_id: c.id, condition: conditions[c.id] }))
    if (!items.length) { setMsg('Rate at least one category.'); return }
    saveReport.mutate({ id, payload: { items, comments: comments.trim() || null } })
  }

  const Info = ({ label, value }) => (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-800">{value || '—'}</span>
    </div>
  )

  return (
    <Modal open onClose={onClose} size="lg" title={item ? carLine(item) : 'Inspection'}>
      {!item ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="space-y-5">
          {msg && <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">{msg}</div>}

          {/* Request info */}
          <div className="rounded-xl border border-gray-200 p-4">
            <Info label="Requester" value={`${item.name} · ${item.phone}`} />
            {item.email && <Info label="Email" value={item.email} />}
            <Info label="Registration" value={item.registration_no} />
            <Info label="City / Address" value={[item.city?.name, item.address].filter(Boolean).join(' · ')} />
            <Info label="Preferred" value={fmt(item.preferred_at)} />
            {item.notes && <Info label="Notes" value={item.notes} />}
            {item.overall_grade && <Info label="Result" value={`Grade ${item.overall_grade} · ${item.overall_score ?? ''}%`} />}
          </div>

          {/* Status */}
          {canEdit && (
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">Update status</p>
              <div className="flex flex-wrap items-center gap-2">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm capitalize outline-none focus:border-ink">
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                {status === 'scheduled' && (
                  <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-ink" />
                )}
                <button onClick={submitStatus} disabled={updateStatus.isPending} className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                  {updateStatus.isPending ? 'Saving…' : 'Update'}
                </button>
              </div>
            </div>
          )}

          {/* Report */}
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
              <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Overall comments (shown to requester)" rows={2}
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-ink" />
              <button onClick={submitReport} disabled={saveReport.isPending} className="mt-3 flex items-center gap-2 rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-ink hover:bg-brand-500 disabled:opacity-60">
                {saveReport.isPending && <Loader2 size={16} className="animate-spin" />} Save Report &amp; Complete
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default function Inspections() {
  const [status, setStatus] = useState('')
  const { data: items = [], isLoading } = useInspections(status)
  const [openId, setOpenId] = useState(null)

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
        <p className="mt-1 text-sm text-gray-500">Manage car-inspection requests and reports.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[{ key: '', label: 'All' }, ...STATUSES.map((s) => ({ key: s, label: s.replace('_', ' ') }))].map((f) => (
          <button key={f.key} onClick={() => setStatus(f.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${status === f.key ? 'bg-ink text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{f.label}</button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-2">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={items}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `${t} requests` }}
          scroll={{ x: 'max-content' }}
          columns={[
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
              title: 'Action', align: 'right', width: 110,
              render: (_, r) => <button onClick={() => setOpenId(r.id)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Manage</button>,
            },
          ]}
        />
      </div>

      {openId && <InspectionModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}
