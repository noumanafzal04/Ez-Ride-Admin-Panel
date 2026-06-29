import { useState } from 'react'
import { App, Form, Input, Select, Button } from 'antd'
import { Megaphone, Users as UsersIcon, MapPin, Globe, Bell, Send } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import adminService from '../services/adminService'
import usePermissions from '../hooks/usePermissions'
import PageHeader from '../components/PageHeader'

const TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'promo', label: 'Promotion' },
  { value: 'update', label: 'App update' },
  { value: 'alert', label: 'Alert' },
]

const AUDIENCES = [
  { value: 'all', icon: Globe, label: 'Everyone', desc: 'All active users' },
  { value: 'user_type', icon: UsersIcon, label: 'By role', desc: 'Riders or drivers' },
  { value: 'city', icon: MapPin, label: 'By city', desc: 'Users in one city' },
]

function AudienceCard({ active, icon: Icon, label, desc, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 items-start gap-3 rounded-xl border p-3.5 text-left transition disabled:opacity-50 ${
        active
          ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-400'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-ink text-brand-400' : 'bg-gray-100 text-gray-500'}`}>
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-semibold ${active ? 'text-ink' : 'text-gray-700'}`}>{label}</span>
        <span className="block text-xs text-gray-400">{desc}</span>
      </span>
    </button>
  )
}

export default function Announcements() {
  const { can } = usePermissions()
  const canSend = can('settings.update')
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [audience, setAudience] = useState('all')
  // Live-preview state.
  const title = Form.useWatch('title', form)
  const body = Form.useWatch('message', form)

  const { data: cities = [] } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: () => adminService.cities().then((r) => r.data?.data?.cities || []),
    enabled: audience === 'city',
    staleTime: 60 * 60 * 1000,
  })

  const send = useMutation({
    mutationFn: (payload) => adminService.broadcastNotification(payload),
    onSuccess: (r) => {
      message.success(r.data?.message || 'Notification sent.')
      form.resetFields(['title', 'message'])
    },
    onError: (e) => message.error(e.response?.data?.message || 'Could not send.'),
  })

  const onFinish = (v) => {
    send.mutate({
      title: v.title,
      message: v.message,
      type: v.type || 'announcement',
      audience,
      user_type: audience === 'user_type' ? v.user_type : undefined,
      city_id: audience === 'city' ? v.city_id : undefined,
    })
  }

  const sendLabel = audience === 'all' ? 'Send to everyone' : audience === 'user_type' ? 'Send to role' : 'Send to city'

  return (
    <div className="w-full">
      <PageHeader
        title="Send Notification"
        subtitle="Push an announcement to users — delivered live in-app and as a phone notification."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: 'announcement' }} disabled={!canSend}>
              <p className="mb-2 text-sm font-semibold text-ink">Audience</p>
              <div className="mb-5 flex flex-col gap-2.5 sm:flex-row">
                {AUDIENCES.map((a) => (
                  <AudienceCard key={a.value} {...a} active={audience === a.value} disabled={!canSend} onClick={() => setAudience(a.value)} />
                ))}
              </div>

              {audience === 'user_type' && (
                <Form.Item name="user_type" label="Role" rules={[{ required: true, message: 'Pick a role' }]}>
                  <Select size="large" placeholder="Choose role"
                    options={[{ value: 'user', label: 'Riders' }, { value: 'driver', label: 'Drivers' }]} />
                </Form.Item>
              )}

              {audience === 'city' && (
                <Form.Item name="city_id" label="City" rules={[{ required: true, message: 'Pick a city' }]}>
                  <Select size="large" showSearch placeholder="Choose city" optionFilterProp="label"
                    options={cities.map((c) => ({ value: c.id, label: c.name }))} />
                </Form.Item>
              )}

              <Form.Item name="type" label="Category">
                <Select size="large" options={TYPES} />
              </Form.Item>

              <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }, { max: 120 }]}>
                <Input size="large" placeholder="e.g. New: Rent a Car is live!" maxLength={120} showCount />
              </Form.Item>

              <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Message is required' }, { max: 500 }]} className="mb-5">
                <Input.TextArea rows={4} placeholder="What do you want to tell users?" maxLength={500} showCount />
              </Form.Item>

              <Button type="primary" htmlType="submit" size="large" loading={send.isPending} icon={<Send size={16} />} block>
                {sendLabel}
              </Button>
              {!canSend && <p className="mt-3 text-center text-xs text-gray-400">You don't have permission to send notifications.</p>}
            </Form>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-linear-to-br from-gray-50 to-gray-100 p-6 shadow-sm">
            <p className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <Megaphone size={14} /> Preview
            </p>

            {/* Phone notification card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-md">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-brand-400">
                  <Bell size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">EZRide</p>
                  <p className="text-[11px] text-gray-400">now</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-gray-900">{title || 'Your title appears here'}</p>
                <p className="mt-1 whitespace-pre-wrap wrap-break-word text-[13px] leading-relaxed text-gray-600">
                  {body || 'Your message preview shows up here as the user will see it.'}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-gray-400">
              Sent live over the in-app feed and as a push notification to users' phones.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
