import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { Attendance } from './pages/Attendance'
import { Classes } from './pages/Classes'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Reports } from './pages/Reports'
import { Students } from './pages/Students'
import { Teachers } from './pages/Teachers'
import { useAuth } from './context/AuthContext'

function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />
}

function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/students" element={<Students />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/reports" element={<Reports />} />
          <Route element={<AdminRoute />}>
            <Route path="/teachers" element={<Teachers />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
