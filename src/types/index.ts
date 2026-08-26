export type UserRole = 'Admin' | 'Teacher'

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused'

export interface UserDto {
  id: string
  fullName: string
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

export interface TeacherClassSummaryDto {
  id: string
  name: string
  code: string
}

export interface TeacherDto {
  id: string
  fullName: string
  email: string
  isActive: boolean
  assignedClasses: TeacherClassSummaryDto[]
}

export interface CreateTeacherDto {
  fullName: string
  email: string
  password: string
  classIds: string[]
}

export interface UpdateTeacherDto {
  fullName: string
  email: string
  classIds: string[]
  isActive?: boolean
}

export interface AttendanceRecordDto {
  id: string
  studentId: string
  studentName: string
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

export interface DashboardDto { totalStudents: number; activeClasses: number; todayAttendancePercentage: number; lowAttendanceAlerts: number }
export interface StudentMonthlyRowDto { studentId: string; studentName: string; enrollmentNumber: string; present: number; absent: number; late: number; excused: number; percentage: number }
export interface MonthlyReportDto { year: number; month: number; className?: string; overallPercentage: number; students: StudentMonthlyRowDto[] }
