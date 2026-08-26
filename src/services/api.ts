import axios from 'axios'
import type { CreateTeacherDto, TeacherDto, UpdateTeacherDto } from '../types'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5289/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('atrio_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('atrio_token')
      localStorage.removeItem('atrio_user')
      if (window.location.pathname !== '/login') window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

/** Teacher management — backend can implement these endpoints without FE contract changes. */
export async function getTeachers(): Promise<TeacherDto[]> {
  const { data } = await apiClient.get<TeacherDto[]>('/teachers')
  return data
}

export async function createTeacher(payload: CreateTeacherDto): Promise<TeacherDto> {
  const { data } = await apiClient.post<TeacherDto>('/teachers', payload)
  return data
}

export async function updateTeacher(id: string, payload: UpdateTeacherDto): Promise<TeacherDto> {
  const { data } = await apiClient.put<TeacherDto>(`/teachers/${id}`, payload)
  return data
}

export async function deactivateTeacher(id: string): Promise<void> {
  await apiClient.post(`/teachers/${id}/deactivate`)
}

export default apiClient
