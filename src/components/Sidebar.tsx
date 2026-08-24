import { CalendarCheck, LayoutDashboard, LineChart, Users } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/reports', label: 'Reports', icon: LineChart },
]

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-col border-r border-slate-200 bg-slate-950 px-4 py-6 text-white">
      <p className="mb-8 px-2 text-lg font-semibold tracking-wide">ATRIO</p>
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
