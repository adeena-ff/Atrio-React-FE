import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { Attendance } from './pages/Attendance'
import { Classes } from './pages/Classes'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Reports } from './pages/Reports'
import { Students } from './pages/Students'
export default function App() { return <BrowserRouter><Routes><Route path="/login" element={<Login />} /><Route element={<AppLayout />}><Route path="/" element={<Dashboard />} /><Route path="/students" element={<Students />} /><Route path="/classes" element={<Classes />} /><Route path="/attendance" element={<Attendance />} /><Route path="/reports" element={<Reports />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter> }
