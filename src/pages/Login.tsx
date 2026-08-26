import { CalendarCheck, LockKeyhole, Mail } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<'Admin' | 'Teacher'>('Admin')
  const [email, setEmail] = useState('admin@atrio.com')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login({ email, password }, role)
      navigate('/')
    } catch {
      setError('Unable to sign in. Check your email, password, and API connection.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_#4338ca66,_transparent_36%),radial-gradient(ellipse_at_bottom_right,_#312e8155,_transparent_40%),#0b1220] lg:grid-cols-2">
      <div className="relative z-10 hidden flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 shadow-lg shadow-indigo-500/35">
            <CalendarCheck className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-wide text-white">ATRIO</span>
        </div>

        <div>
          <p className="max-w-lg text-5xl font-bold leading-[1.1] tracking-tight text-white">
            Better attendance starts with a clearer picture.
          </p>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            The calm, connected workspace for teachers and administrators.
          </p>
        </div>

        <p className="text-sm text-slate-500">© 2026 Atrio</p>
      </div>

      <div className="relative z-10 flex items-center justify-center p-5 sm:p-10">
        <div className="pointer-events-none absolute h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" aria-hidden />
        <form onSubmit={submit} className="glass relative w-full max-w-md rounded-2xl p-7 shadow-xl sm:p-9">
          <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">WELCOME BACK</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Sign in to your workspace</h1>

          <div className="mt-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-slate-950/50 p-1">
            {(['Admin', 'Teacher'] as const).map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setRole(item)}
                className={`rounded-xl py-2.5 text-sm font-medium transition-all ${
                  role === item
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <label className="mt-6 block text-sm font-medium text-slate-300">
            Email
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                className="field field-with-icon"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label className="mt-4 block text-sm font-medium text-slate-300">
            Password
            <div className="relative mt-2">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
              <input
                className="field field-with-icon"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </label>

          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

          <button disabled={submitting} className="btn-primary mt-6 w-full">
            {submitting ? 'Signing in...' : `Sign in as ${role}`}
          </button>

          <p className="mt-4 text-center text-xs text-slate-500">Use the seeded account: admin@atrio.com</p>
        </form>
      </div>
    </div>
  )
}
