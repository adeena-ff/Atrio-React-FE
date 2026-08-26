import { Plus, Search, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import { AttendanceBadge } from '../components/common/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useVisibleClasses } from '../hooks/useVisibleClasses'
import apiClient from '../services/api'
import type { ClassDto, CreateStudentDto, StudentDto } from '../types'

export function Students() {
  const { isAdmin, isTeacher } = useAuth()
  const [students, setStudents] = useState<StudentDto[]>([])
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [query, setQuery] = useState('')
  const [classId, setClassId] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CreateStudentDto>({
    firstName: '',
    lastName: '',
    email: '',
    enrollmentNumber: '',
    classId: '',
  })
  const { classes: visibleClasses, label: classFilterLabel } = useVisibleClasses(classes)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [studentResult, classResult] = await Promise.all([
        apiClient.get<StudentDto[]>('/students', {
          params: { search: query || undefined, classId: classId || undefined },
        }),
        apiClient.get<ClassDto[]>('/classes'),
      ])
      setStudents(studentResult.data)
      setClasses(classResult.data)
    } catch (e) {
      setError(errorMessage(e, 'Students could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [query, classId])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(timer)
  }, [load])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isAdmin) return
    setError('')
    try {
      await apiClient.post('/students', form)
      setShowModal(false)
      setForm({ firstName: '', lastName: '', email: '', enrollmentNumber: '', classId: '' })
      await load()
    } catch (e) {
      setError(errorMessage(e, 'Student could not be created.'))
    }
  }

  return (
    <section>
      <PageHeader
        title="Student management"
        description={
          isTeacher
            ? 'View student rosters and attendance history for your classes.'
            : 'Search, review, and add live student records.'
        }
        action={
          isAdmin ? (
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              Add student
            </button>
          ) : undefined
        }
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      {loading ? (
        <LoadingState label="Loading students..." />
      ) : (
        <div className="glass overflow-hidden rounded-2xl shadow-xl">
          <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                className="field field-with-icon"
                placeholder="Search by name, enrollment or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="field px-4 py-2.5 sm:w-56"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              aria-label={classFilterLabel}
            >
              <option value="">{isTeacher ? classFilterLabel : 'All classes'}</option>
              {visibleClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="bg-slate-950/40 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Student</th>
                  <th className="px-4 py-4 font-semibold">Enrollment</th>
                  <th className="px-4 py-4 font-semibold">Class</th>
                  <th className="px-5 py-4 font-semibold">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-white/5 text-slate-300 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4 font-medium text-white">
                      {s.firstName} {s.lastName}
                    </td>
                    <td className="px-4 py-4">{s.enrollmentNumber}</td>
                    <td className="px-4 py-4">{s.className}</td>
                    <td className="px-5 py-4">
                      <AttendanceBadge percentage={s.attendancePercentage} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAdmin && showModal && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="glass relative w-full max-w-lg rounded-2xl p-6 shadow-xl sm:p-7">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <h2 className="text-xl font-bold tracking-tight text-white">Add a student</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(['firstName', 'lastName', 'email', 'enrollmentNumber'] as const).map((key) => (
                <input
                  key={key}
                  required
                  className="field px-4 py-2.5"
                  type={key === 'email' ? 'email' : 'text'}
                  placeholder={
                    key === 'enrollmentNumber'
                      ? 'Enrollment number'
                      : key === 'firstName'
                        ? 'First name'
                        : key === 'lastName'
                          ? 'Last name'
                          : 'Email address'
                  }
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              ))}
            </div>
            <select
              required
              className="field mt-3 px-4 py-2.5"
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
            >
              <option value="">Choose a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">Save student</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
