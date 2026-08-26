import { Bell, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="glass z-10 flex h-18 shrink-0 items-center justify-between border-x-0 border-t-0 px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-xl p-2 text-slate-300 transition hover:bg-white/5 md:hidden" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div>
          <p className="font-semibold tracking-tight text-white">
            Good morning, {user?.fullName?.split(' ')[0] ?? 'Avery'}
          </p>
          <p className="text-xs text-slate-400">Tuesday, August 25, 2026</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="relative rounded-xl p-2.5 text-slate-300 transition hover:bg-white/5" aria-label="Notifications">
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgb(244_63_94_/_0.8)]" />
        </button>
        <button type="button" onClick={logout} className="btn-secondary px-3 py-2 text-sm">
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
