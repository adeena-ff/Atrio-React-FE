export type UserRole = 'Admin' | 'Teacher'

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused'

export interface UserDto {
  id: string
  fullName: string
  /** Optional display name alias if backend returns `name` instead of `fullName`. */
  name?: string
  email: string
  role: UserRole
  isActive: boolean
  /** Populated for teachers once backend assigns classes; optional for Admin. */
  assignedClassIds?: string[]
}

export interface LoginRequestDto {
  email: string
  password: string
}

export interface LoginResponseDto {
  token: string
  user: UserDto
}

export interface StudentDto {
  id: string
  firstName: string
  lastName: string
  email: string
  enrollmentNumber: string
  classId: string
  className?: string
  isActive: boolean
  attendancePercentage: number
}

export interface CreateStudentDto {
  firstName: string
  lastName: string
  email: string
  enrollmentNumber: string
  classId: string
}

export interface ClassDto {
  id: string
  name: string
  code: string
  academicYear: string
  isActive: boolean
  studentCount: number
}

export interface CreateClassDto {
  name: string
  code: string
  academicYear: string
}

export interface TeacherDto {
  id: string
  fullName: string
  email: string
  isActive: boolean
  assignedClassIds: string[]
}

export interface CreateTeacherDto {
  fullName: string
  email: string
  password: string
  assignedClassIds: string[]
}

export interface UpdateTeacherDto {
  fullName: string
  email: string
  assignedClassIds: string[]
  isActive?: boolean
}

export interface AttendanceRecordDto {
  id: string
  studentId: string
  studentName: string
  enrollmentNumber?: string
  classId: string
  recordedByUserId: string
  attendanceDate: string
  status: AttendanceStatus
  notes?: string | null
}

export interface CreateAttendanceRecordDto {
  studentId: string
  classId: string
  attendanceDate: string
  status: AttendanceStatus
  notes?: string
}

/** Batch mark payload expected by POST /api/attendance/mark */
export interface MarkAttendanceRecordDto {
  studentId: string
  status: AttendanceStatus
}

export interface MarkAttendanceRequestDto {
  classId: string
  date: string
  records: MarkAttendanceRecordDto[]
}

export interface DashboardDto { totalStudents: number; activeClasses: number; todayAttendancePercentage: number; lowAttendanceAlerts: number }
export interface StudentMonthlyRowDto { studentId: string; studentName: string; enrollmentNumber: string; present: number; absent: number; late: number; excused: number; percentage: number }
export interface MonthlyReportDto { year: number; month: number; className?: string; overallPercentage: number; students: StudentMonthlyRowDto[] }

export interface PagedResultDto<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ListQueryParams {
  search?: string
  classId?: string
  status?: string
  department?: string
  pageNumber?: number
  pageSize?: number
}

/** Point on a daily attendance trend series (Dashboard operational charts). */
export interface DailyAttendancePointDto {
  date: string
  percentage: number
  present: number
  late: number
  absent: number
  excused: number
}

/** Named category slice for bar / donut breakdowns. */
export interface NamedMetricDto {
  id: string
  name: string
  value: number
  secondaryValue?: number
}

export interface AtRiskStudentDto {
  studentId: string
  studentName: string
  enrollmentNumber: string
  classId: string
  className: string
  percentage: number
}

export interface ClassTodayGaugeDto {
  classId: string
  className: string
  code: string
  markedCount: number
  studentCount: number
  percentage: number
}

export interface StudentHistoryPointDto {
  date: string
  status: AttendanceStatus
  className: string
}

export interface StudentHistoryDto {
  studentId: string
  studentName: string
  enrollmentNumber: string
  percentage: number
  timeline: StudentHistoryPointDto[]
}

/**
 * Operational real-time analytics for Dashboard.
 * Role is inferred from the auth token; teachers receive scoped class data.
 */
export interface DashboardAnalyticsDto {
  role: UserRole
  metrics: {
    totalStudents: number
    activeClasses: number
    todayAttendancePercentage: number
    atRiskCount: number
  }
  /** Admin: last 30 days institution trend. Teacher: last 7–30 days across assigned courses. */
  dailyTrend: DailyAttendancePointDto[]
  /** Admin: departmental / course breakdown. Teacher: weekly course comparison. */
  courseBreakdown: NamedMetricDto[]
  atRiskStudents: AtRiskStudentDto[]
  /** Teacher-only: per-class roll-call completion gauges for today. */
  myClassesToday?: ClassTodayGaugeDto[]
}

/**
 * Historical analytical payload for Reports.
 */
export interface ReportsAnalyticsDto {
  role: UserRole
  startDate: string
  endDate: string
  classId?: string | null
  kpis: {
    totalEvents: number
    activeLearners: number
    systemAveragePercentage: number
    atRiskCount: number
  }
  /** Status distribution for donut/pie (Present/Late/Absent/Excused counts). */
  statusDistribution: NamedMetricDto[]
  /** Per-course attendance averages for heatmap/bar. */
  coursePerformance: NamedMetricDto[]
  /** Teacher: multi-axis performance (Present%, Late%, Absent%, Excused%, Overall%). */
  courseRadar?: NamedMetricDto[]
  classBreakdown: {
    classId: string
    className: string
    code: string
    percentage: number
    present: number
    late: number
    absent: number
    excused: number
    students: StudentMonthlyRowDto[]
  }[]
  studentHistories: StudentHistoryDto[]
}
