import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { LoginRequestDto, UserDto, UserRole } from '../types'
import apiClient from '../services/api'

interface AuthContextValue {
  user: UserDto | null
  role: UserRole | null
  isAuthenticated: boolean
  isAdmin: boolean
  isTeacher: boolean
  login: (credentials: LoginRequestDto, role?: UserRole) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function normalizeRole(role: string | undefined): UserRole {
  if (role === 'Teacher' || role === 'Staff') return 'Teacher'
  return 'Admin'
}

function normalizeUser(raw: UserDto): UserDto {
  return {
    ...raw,
    role: normalizeRole(raw.role),
    assignedClassIds: Array.isArray(raw.assignedClassIds)
      ? raw.assignedClassIds.map(String)
      : [],
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(() => {
    const saved = localStorage.getItem('atrio_user')
    if (!saved) return null
    try {
      return normalizeUser(JSON.parse(saved) as UserDto)
    } catch {
      return null
    }
  })

  const login = useCallback(async (credentials: LoginRequestDto, _role?: UserRole) => {
    const { data } = await apiClient.post<{ token: string; user: UserDto }>('/auth/login', credentials)
    const nextUser = normalizeUser(data.user)
    setUser(nextUser)
    localStorage.setItem('atrio_user', JSON.stringify(nextUser))
    localStorage.setItem('atrio_token', data.token)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('atrio_user')
    localStorage.removeItem('atrio_token')
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const role = user?.role ?? null
    return {
      user,
      role,
      isAuthenticated: Boolean(user),
      isAdmin: role === 'Admin',
      isTeacher: role === 'Teacher',
      login,
      logout,
    }
  }, [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within an AuthProvider')
  return value
}
