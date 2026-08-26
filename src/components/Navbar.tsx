import { Bell, LogOut, Menu } from 'lucide-react'
import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Navbar() {
  const { user, logout } = useAuth()

  const displayName = user?.name || user?.fullName || user?.email || 'User'
  const firstName = displayName.split(/\s+/)[0] || 'User'
  const greeting = greetingForHour(new Date().getHours())

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  )

  return (
    <header className="glass z-10 flex h-18 shrink-0 items-center justify-between border-x-0 border-t-0 px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button type="button" className="rounded-xl p-2 text-slate-300 transition hover:bg-white/5 md:hidden" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div>
          <p className="font-semibold tracking-tight text-white">
            {greeting}, {firstName}
          </p>
          <p className="text-xs text-slate-400">{todayLabel}</p>
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
