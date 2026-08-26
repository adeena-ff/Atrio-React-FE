import axios from 'axios'
import { notify } from '../components/common/AppToaster'
import type {
  ClassDto,
  CreateTeacherDto,
  DashboardAnalyticsDto,
  ListQueryParams,
  MarkAttendanceRequestDto,
  PagedResultDto,
  ReportsAnalyticsDto,
  StudentDto,
  TeacherDto,
  UpdateTeacherDto,
} from '../types'
import { normalizePagedResult } from '../utils/pagination'

/** Backend QueryFilter.MaximumPageSize */
const MAX_PAGE_SIZE = 100

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
    const status = error.response?.status as number | undefined

    if (status === 401) {
      localStorage.removeItem('atrio_token')
      localStorage.removeItem('atrio_user')
      if (window.location.pathname !== '/login') {
        notify.error('Session expired. Please sign in again.')
        window.location.assign('/login')
      }
    } else if (status && status >= 500) {
      notify.error('Server error. Please try again in a moment.')
    } else if (!error.response) {
      notify.error('Network error. Check your API connection.')
    }

    return Promise.reject(error)
  },
)

function listParams(params: ListQueryParams) {
  return {
    search: params.search || undefined,
    classId: params.classId || undefined,
    status: params.status || undefined,
    academicYear: params.academicYear || undefined,
    pageNumber: params.pageNumber ?? 1,
    pageSize: params.pageSize ?? 10,
  }
}

/** Fallback only when API still returns a bare array. */
function filterStudentsLocally(items: StudentDto[], params: ReturnType<typeof listParams>) {
  let next = items
  const term = params.search?.trim().toLowerCase()
  if (term) {
    next = next.filter(
      (s) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
        s.enrollmentNumber.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term),
    )
  }
  if (params.classId) next = next.filter((s) => s.classId === params.classId)
  if (params.status === 'active') next = next.filter((s) => s.isActive)
  if (params.status === 'inactive') next = next.filter((s) => !s.isActive)
  if (params.status === 'at-risk') next = next.filter((s) => s.attendancePercentage < 75)
  return next
}

function filterClassesLocally(items: ClassDto[], params: ReturnType<typeof listParams>) {
  let next = items
  const term = params.search?.trim().toLowerCase()
  if (term) {
    next = next.filter(
      (c) => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term),
    )
  }
  if (params.academicYear) next = next.filter((c) => c.academicYear === params.academicYear)
  if (params.status === 'active') next = next.filter((c) => c.isActive)
  if (params.status === 'inactive') next = next.filter((c) => !c.isActive)
  return next
}

function filterTeachersLocally(items: TeacherDto[], params: ReturnType<typeof listParams>) {
  let next = items
  const term = params.search?.trim().toLowerCase()
  if (term) {
    next = next.filter(
      (t) => t.fullName.toLowerCase().includes(term) || t.email.toLowerCase().includes(term),
    )
  }
  if (params.classId) {
    next = next.filter((t) => (t.assignedClassIds ?? []).includes(params.classId!))
  }
  if (params.status === 'active') next = next.filter((t) => t.isActive)
  if (params.status === 'inactive') next = next.filter((t) => !t.isActive)
  return next
}

async function fetchAllPages<T>(
  request: (pageNumber: number, pageSize: number) => Promise<PagedResultDto<T> | T[]>,
): Promise<T[]> {
  const all: T[] = []
  let pageNumber = 1
  for (;;) {
    const data = await request(pageNumber, MAX_PAGE_SIZE)
    const page = normalizePagedResult(data, pageNumber, MAX_PAGE_SIZE)
    all.push(...page.items)
    if (!page.hasNextPage || page.items.length === 0) break
    pageNumber += 1
    if (pageNumber > 50) break
  }
  return all
}

export async function getStudentsPage(params: ListQueryParams = {}): Promise<PagedResultDto<StudentDto>> {
  const query = listParams(params)
  const { data } = await apiClient.get<PagedResultDto<StudentDto> | StudentDto[]>('/students', {
    params: {
      search: query.search,
      classId: query.classId,
      status: query.status,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
  })
  if (Array.isArray(data)) {
    return normalizePagedResult(filterStudentsLocally(data, query), query.pageNumber!, query.pageSize!)
  }
  return normalizePagedResult(data, query.pageNumber!, query.pageSize!)
}

export async function getClassesPage(params: ListQueryParams = {}): Promise<PagedResultDto<ClassDto>> {
  const query = listParams(params)
  const { data } = await apiClient.get<PagedResultDto<ClassDto> | ClassDto[]>('/classes', {
    params: {
      search: query.search,
      academicYear: query.academicYear,
      status: query.status,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
  })
  if (Array.isArray(data)) {
    return normalizePagedResult(filterClassesLocally(data, query), query.pageNumber!, query.pageSize!)
  }
  return normalizePagedResult(data, query.pageNumber!, query.pageSize!)
}

/** Full class list for dropdowns/filters (unwraps paged envelopes; pages until complete). */
export async function getClassOptions(): Promise<ClassDto[]> {
  return fetchAllPages(async (pageNumber, pageSize) => {
    const { data } = await apiClient.get<PagedResultDto<ClassDto> | ClassDto[]>('/classes', {
      params: { pageNumber, pageSize },
    })
    return data
  })
}

export async function getTeachers(params: ListQueryParams = {}): Promise<PagedResultDto<TeacherDto>> {
  const query = listParams(params)
  const { data } = await apiClient.get<PagedResultDto<TeacherDto> | TeacherDto[]>('/teachers', {
    params: {
      search: query.search,
      classId: query.classId,
      status: query.status,
      pageNumber: query.pageNumber,
      pageSize: query.pageSize,
    },
  })
  if (Array.isArray(data)) {
    return normalizePagedResult(filterTeachersLocally(data, query), query.pageNumber!, query.pageSize!)
  }
  return normalizePagedResult(data, query.pageNumber!, query.pageSize!)
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

export async function getDashboardAnalytics(): Promise<DashboardAnalyticsDto> {
  const { data } = await apiClient.get<DashboardAnalyticsDto>('/analytics/dashboard')
  return data
}

export async function getReportsAnalytics(
  startDate: string,
  endDate: string,
  classId?: string,
): Promise<ReportsAnalyticsDto> {
  const { data } = await apiClient.get<ReportsAnalyticsDto>('/analytics/reports', {
    params: {
      startDate,
      endDate,
      classId: classId || undefined,
    },
  })
  return data
}

export async function markAttendance(payload: MarkAttendanceRequestDto): Promise<void> {
  await apiClient.post('/attendance/mark', payload)
}

export default apiClient
