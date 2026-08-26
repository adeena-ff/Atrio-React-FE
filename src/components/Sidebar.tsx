import { CalendarCheck, GraduationCap, LayoutDashboard, LineChart, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/classes', label: 'Classes', icon: GraduationCap },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/reports', label: 'Reports', icon: LineChart },
]

export function Sidebar() {
  return (
    <aside className="glass hidden h-full w-64 shrink-0 flex-col border-y-0 border-l-0 px-4 py-6 md:flex">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 shadow-lg shadow-indigo-500/30">
          <CalendarCheck size={20} className="text-white" />
        </div>
        <div>
          <p className="text-lg font-bold tracking-wide text-white">ATRIO</p>
          <p className="text-xs text-slate-400">Attendance management</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <p className="mt-auto px-2 text-xs text-slate-500">© 2026 Atrio</p>
    </aside>
  )
}
