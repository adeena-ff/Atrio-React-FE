import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
export function AppLayout() { return <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#1e3a8a55,_transparent_28%),linear-gradient(135deg,#0f172a,#111827)]"><div className="mx-auto flex min-h-screen max-w-[1600px]"><Sidebar /><div className="min-w-0 flex-1"><Navbar /><main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><Outlet /></main></div></div></div> }
