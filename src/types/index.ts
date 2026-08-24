export type UserRole = 'Admin' | 'Staff'

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused'

export interface UserDto {
  id: string
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
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
}

export interface CreateClassDto {
  name: string
  code: string
  academicYear: string
}

export interface AttendanceRecordDto {
  id: string
  studentId: string
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
