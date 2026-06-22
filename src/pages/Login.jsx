import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useLogin } from '../hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const login = useLogin({
    onSuccess: () => navigate('/', { replace: true }),
    onError: (err) => setError(err.friendly || err.response?.data?.message || 'Login failed. Please try again.'),
  })

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) { setError('Please enter your email and password.'); return }
    login.mutate({ email: email.trim(), password })
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-ink to-ink-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-400 text-ink">
            <Car size={22} />
          </div>
          <span className="text-xl font-bold">EZRide Admin</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Manage your platform with confidence.</h1>
          <p className="mt-4 max-w-md text-white/70">
            Users, verifications, inspections, service providers and reports — all in one control panel.
          </p>
        </div>
        <p className="text-sm text-white/50">© {new Date().getFullYear()} EZRide. All rights reserved.</p>
      </div>

      {/* Form */}
      <div className="flex w-full items-center justify-center bg-[#f7f8fa] p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-brand-400">
              <Car size={22} />
            </div>
            <span className="text-xl font-bold text-ink">EZRide Admin</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-500">Sign in to your admin account to continue.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
              <div className="relative">
                <Mail size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ezride.com"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-ink focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-sm font-medium text-ink hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <Lock size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-gray-800 outline-none transition focus:border-ink focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-400 py-3 text-sm font-semibold text-ink transition hover:bg-brand-500 disabled:opacity-60"
            >
              {login.isPending && <Loader2 size={18} className="animate-spin" />}
              {login.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Authorized personnel only. Access is role &amp; permission based.
          </p>
        </div>
      </div>
    </div>
  )
}
