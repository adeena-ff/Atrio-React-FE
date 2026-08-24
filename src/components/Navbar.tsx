import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <p className="text-sm font-medium text-slate-900">Atrio</p>
        <p className="text-xs text-slate-500">Zynthra Technologies</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">{user?.fullName ?? 'Guest'}</span>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </header>
  )
}
