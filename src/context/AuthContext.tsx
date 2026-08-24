import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import apiClient from '../services/api'
import type { LoginRequestDto, LoginResponseDto, UserDto } from '../types'

interface AuthContextValue {
  user: UserDto | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginRequestDto) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(() => {
    const stored = localStorage.getItem('atrio_user')
    return stored ? (JSON.parse(stored) as UserDto) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('atrio_token'))

  const login = useCallback(async (credentials: LoginRequestDto) => {
    const { data } = await apiClient.post<LoginResponseDto>('/api/auth/login', credentials)
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem('atrio_user', JSON.stringify(data.user))
    localStorage.setItem('atrio_token', data.token)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('atrio_user')
    localStorage.removeItem('atrio_token')
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      login,
      logout,
    }),
    [user, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
