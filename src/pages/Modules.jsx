import { App, Switch, Tag, Spin } from 'antd'
import { Car, ClipboardCheck, CarFront, Wrench, Tag as TagIcon, ToggleLeft } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminService from '../services/adminService'
import usePermissions from '../hooks/usePermissions'

// Per-module presentation (icon + colour + blurb) keyed by the backend `key`.
const META = {
  ride:        { icon: Car,          tint: 'bg-blue-50 text-blue-600',     desc: 'Carpool ride posting & booking between cities.' },
  inspection:  { icon: ClipboardCheck, tint: 'bg-violet-50 text-violet-600', desc: '120-point car inspection requests.' },
  rental:      { icon: CarFront,     tint: 'bg-rose-50 text-rose-600',     desc: 'Rent a car — self-drive or with driver.' },
  service:     { icon: Wrench,       tint: 'bg-emerald-50 text-emerald-600', desc: 'Car services & verified providers.' },
  marketplace: { icon: TagIcon,      tint: 'bg-orange-50 text-orange-600', desc: 'Buy & sell used cars.' },
}

export default function Modules() {
  const { can } = usePermissions()
  const canEdit = can('settings.update')
  const qc = useQueryClient()
  const { message } = App.useApp()

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: () => adminService.modules().then((r) => r.data?.data?.modules || []),
  })

  const toggle = useMutation({
    mutationFn: ({ key, enabled }) => adminService.setModule(key, enabled),
    onMutate: async ({ key, enabled }) => {
      await qc.cancelQueries({ queryKey: ['admin-modules'] })
      const prev = qc.getQueryData(['admin-modules'])
      qc.setQueryData(['admin-modules'], (old = []) => old.map((m) => (m.key === key ? { ...m, enabled } : m)))
      return { prev }
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin-modules'], ctx.prev)
      message.error(e.response?.data?.message || 'Could not update.')
    },
    onSuccess: (_d, v) => message.success(`${META[v.key] ? '' : ''}Module ${v.enabled ? 'enabled' : 'disabled'}`),
    onSettled: () => qc.invalidateQueries({ queryKey: ['admin-modules'] }),
  })

  const liveCount = modules.filter((m) => m.enabled).length

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-brand-400">
          <ToggleLeft size={22} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-ink">Module Settings</h1>
          <p className="max-w-2xl text-sm text-gray-500">
            Turn features on or off across the mobile app. A disabled module disappears from the
            app's home, search, sidebar and tabs for everyone — instantly on their next refresh.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spin /></div>
      ) : (
        <>
          <div className="text-xs font-medium text-gray-400">
            {liveCount} of {modules.length} modules live
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map((m) => {
              const meta = META[m.key] || { icon: ToggleLeft, tint: 'bg-gray-100 text-gray-500', desc: '' }
              const Ico = meta.icon
              return (
                <div
                  key={m.key}
                  className={`flex items-start gap-4 rounded-2xl border bg-white p-5 transition
                    ${m.enabled ? 'border-emerald-200 shadow-sm' : 'border-gray-100'}`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.tint}`}>
                    <Ico size={22} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-ink">{m.name}</h3>
                      <Tag color={m.enabled ? 'green' : 'default'} className="m-0">
                        {m.enabled ? 'Live' : 'Hidden'}
                      </Tag>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{meta.desc}</p>
                    <p className="mt-1 text-[11px] text-gray-300">key: {m.key}</p>
                  </div>

                  <Switch
                    checked={!!m.enabled}
                    disabled={!canEdit || toggle.isPending}
                    onChange={(val) => toggle.mutate({ key: m.key, enabled: val })}
                  />
                </div>
              )
            })}
          </div>
        </>
      )}

      {!canEdit && (
        <p className="text-xs text-gray-400">View-only — ask a Super Admin to change modules.</p>
      )}
    </div>
  )
}
