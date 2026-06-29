import { useState } from 'react'
import { App, Card, Form, Input, Select, Segmented, Button } from 'antd'
import { Megaphone, Users as UsersIcon, MapPin, Globe } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import adminService from '../services/adminService'
import usePermissions from '../hooks/usePermissions'

const TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'promo', label: 'Promotion' },
  { value: 'update', label: 'App update' },
  { value: 'alert', label: 'Alert' },
]

export default function Announcements() {
  const { can } = usePermissions()
  const canSend = can('settings.update')
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const [audience, setAudience] = useState('all')

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-brand-400">
          <Megaphone size={22} />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-ink">Send Notification</h1>
          <p className="text-sm text-gray-500">
            Push an announcement to users — delivered live (in-app) and as a phone notification.
          </p>
        </div>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: 'announcement' }} disabled={!canSend}>
          {/* Audience */}
          <Form.Item label="Send to">
            <Segmented
              size="large"
              value={audience}
              onChange={setAudience}
              options={[
                { value: 'all', label: <span className="flex items-center gap-2"><Globe size={15} /> Everyone</span> },
                { value: 'user_type', label: <span className="flex items-center gap-2"><UsersIcon size={15} /> By role</span> },
                { value: 'city', label: <span className="flex items-center gap-2"><MapPin size={15} /> By city</span> },
              ]}
            />
          </Form.Item>

          {audience === 'user_type' && (
            <Form.Item name="user_type" label="Role" rules={[{ required: true, message: 'Pick a role' }]}>
              <Select
                placeholder="Choose role"
                options={[{ value: 'user', label: 'Riders' }, { value: 'driver', label: 'Drivers' }]}
              />
            </Form.Item>
          )}

          {audience === 'city' && (
            <Form.Item name="city_id" label="City" rules={[{ required: true, message: 'Pick a city' }]}>
              <Select
                showSearch
                placeholder="Choose city"
                optionFilterProp="label"
                options={cities.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
          )}

          <Form.Item name="type" label="Category">
            <Select options={TYPES} />
          </Form.Item>

          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }, { max: 120 }]}>
            <Input placeholder="e.g. New: Rent a Car is live!" maxLength={120} showCount />
          </Form.Item>

          <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Message is required' }, { max: 500 }]}>
            <Input.TextArea rows={4} placeholder="What do you want to tell users?" maxLength={500} showCount />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" loading={send.isPending} block>
            {audience === 'all' ? 'Send to everyone' : audience === 'user_type' ? 'Send to role' : 'Send to city'}
          </Button>
          {!canSend && <p className="mt-3 text-xs text-gray-400">You don't have permission to send notifications.</p>}
        </Form>
      </Card>
    </div>
  )
}
