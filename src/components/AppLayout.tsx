import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_#312e8155,_transparent_42%),radial-gradient(ellipse_at_bottom_left,_#1e3a8a33,_transparent_40%),linear-gradient(160deg,#0b1220_0%,#111827_55%,#0f172a_100%)]">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-6 sm:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
