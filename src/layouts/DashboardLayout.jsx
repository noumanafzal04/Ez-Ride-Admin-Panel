import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import useAdminRealtime from '../hooks/useAdminRealtime'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  useAdminRealtime() // live admin notifications over Reverb

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
      <Sidebar collapsed={collapsed} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onToggleSidebar={() => setCollapsed(v => !v)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
