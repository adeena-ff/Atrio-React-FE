import { Plus, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ErrorBanner, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import { AttendanceBadge } from '../components/common/StatusBadge'
import { PaginationBar, TableControls, TableSkeleton } from '../components/common/TableControls'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useVisibleClasses } from '../hooks/useVisibleClasses'
import apiClient, { getStudentsPage } from '../services/api'
import type { ClassDto, CreateStudentDto, PagedResultDto, StudentDto } from '../types'
import { emptyPage } from '../utils/pagination'

export function Students() {
  const { isAdmin, isTeacher } = useAuth()
  const [page, setPage] = useState<PagedResultDto<StudentDto>>(emptyPage())
  const [allClasses, setAllClasses] = useState<ClassDto[]>([])
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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

  const debouncedSearch = useDebouncedValue(search, 300)
  const { classes: visibleClasses, label: classFilterLabel } = useVisibleClasses(allClasses)

  const resetToFirstPage = () => setPageNumber(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [studentPage, classResult] = await Promise.all([
        getStudentsPage({
          search: debouncedSearch,
          classId: classId || undefined,
          status: status || undefined,
          pageNumber,
          pageSize,
        }),
        apiClient.get<ClassDto[]>('/classes'),
      ])
      setPage(studentPage)
      setAllClasses(Array.isArray(classResult.data) ? classResult.data : [])
    } catch (e) {
      setError(errorMessage(e, 'Students could not be loaded.'))
      setPage(emptyPage(pageNumber, pageSize))
    } finally {
      setLoading(false)
    }
  }, [classId, debouncedSearch, pageNumber, pageSize, status])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    resetToFirstPage()
  }, [debouncedSearch, classId, status])

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
            <button className="btn-primary cursor-pointer transition-all duration-200 active:scale-95" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              Add student
            </button>
          ) : undefined
        }
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      <div className="glass overflow-hidden rounded-2xl shadow-xl">
        <TableControls
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or student ID..."
          filters={[
            {
              id: 'class',
              label: 'Class',
              value: classId,
              onChange: setClassId,
              allLabel: isTeacher ? classFilterLabel : 'All classes',
              options: visibleClasses.map((c) => ({ value: c.id, label: c.name })),
            },
            {
              id: 'status',
              label: 'Status',
              value: status,
              onChange: setStatus,
              allLabel: 'All statuses',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'at-risk', label: 'At risk (<75%)' },
              ],
            },
          ]}
        />

        {loading ? (
          <TableSkeleton rows={pageSize > 10 ? 8 : 6} columns={4} />
        ) : (
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
                {page.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center text-sm text-slate-500">
                      No students match your filters.
                    </td>
                  </tr>
                ) : (
                  page.items.map((s) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <PaginationBar
          pageNumber={page.pageNumber}
          pageSize={page.pageSize}
          totalCount={page.totalCount}
          totalPages={page.totalPages}
          hasPreviousPage={page.hasPreviousPage}
          hasNextPage={page.hasNextPage}
          onPageChange={setPageNumber}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setPageNumber(1)
          }}
        />
      </div>

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
              {allClasses.map((c) => (
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
