import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Placeholder from './pages/Placeholder'
import Roles from './pages/Roles'
import Staff from './pages/Staff'
import Users from './pages/Users'
import Rides from './pages/Rides'
import Categories from './pages/Categories'
import Providers from './pages/Providers'
import Inspections from './pages/Inspections'
import Reports from './pages/Reports'
import Billing from './pages/Billing'
import Modules from './pages/Modules'
import Announcements from './pages/Announcements'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/rides" element={<Rides />} />
          <Route path="/inspections" element={<Inspections />} />
          <Route path="/providers" element={<Providers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/roles" element={<Roles />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/settings" element={<Modules />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
