import { BookOpen, CalendarRange, Plus, ShieldCheck, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ErrorBanner, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import { PaginationBar, TableControls, TableSkeleton } from '../components/common/TableControls'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useVisibleClasses } from '../hooks/useVisibleClasses'
import apiClient, { getClassOptions, getClassesPage } from '../services/api'
import type { ClassDto, CreateClassDto, PagedResultDto } from '../types'
import { emptyPage } from '../utils/pagination'

const emptyForm: CreateClassDto = {
  name: '',
  code: '',
  academicYear: new Date().getFullYear().toString(),
}

export function Classes() {
  const { isAdmin, isTeacher } = useAuth()
  const [page, setPage] = useState<PagedResultDto<ClassDto>>(emptyPage())
  const [yearOptions, setYearOptions] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [status, setStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<CreateClassDto>(emptyForm)

  const debouncedSearch = useDebouncedValue(search, 300)
  const { isScopedToAssignments } = useVisibleClasses(page.items)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [result, allClasses] = await Promise.all([
        getClassesPage({
          search: debouncedSearch,
          academicYear: academicYear || undefined,
          status: status || undefined,
          pageNumber,
          pageSize,
        }),
        getClassOptions(),
      ])
      setPage(result)
      setYearOptions(Array.from(new Set(allClasses.map((c) => c.academicYear).filter(Boolean))).sort())
    } catch (e) {
      setError(errorMessage(e, 'Classes could not be loaded.'))
      setPage(emptyPage(pageNumber, pageSize))
    } finally {
      setLoading(false)
    }
  }, [academicYear, debouncedSearch, pageNumber, pageSize, status])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPageNumber(1)
  }, [academicYear, debouncedSearch, status])

  const yearFilters = useMemo(
    () => yearOptions.map((year) => ({ value: year, label: year })),
    [yearOptions],
  )

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isAdmin) return
    setError('')
    try {
      await apiClient.post('/classes', form)
      setShowModal(false)
      setForm(emptyForm)
      await load()
    } catch (e) {
      setError(errorMessage(e, 'Class could not be created.'))
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        title="Class management"
        description={
          isTeacher
            ? 'Your assigned courses and their live student rosters.'
            : 'Active courses and their live student rosters.'
        }
        action={
          isAdmin ? (
            <button
              type="button"
              className="btn-primary cursor-pointer transition-all duration-200 active:scale-95"
              onClick={() => setShowModal(true)}
            >
              <Plus size={18} />
              Create class
            </button>
          ) : undefined
        }
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      {isTeacher && isScopedToAssignments && (
        <p className="text-sm text-indigo-200/90">Showing classes assigned to your teacher account.</p>
      )}

      <div className="glass overflow-hidden rounded-2xl shadow-xl">
        <TableControls
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by class name or code..."
          onClearFilters={() => {
            setSearch('')
            setAcademicYear('')
            setStatus('')
          }}
          filters={[
            {
              id: 'academicYear',
              label: 'Academic year',
              value: academicYear,
              onChange: setAcademicYear,
              allLabel: 'All years',
              icon: CalendarRange,
              options: yearFilters,
            },
            {
              id: 'status',
              label: 'Status',
              value: status,
              onChange: setStatus,
              allLabel: 'All statuses',
              icon: ShieldCheck,
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
        />

        {loading ? (
          <div className="p-5">
            <TableSkeleton rows={6} columns={3} />
          </div>
        ) : page.items.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-500">No classes match your filters.</p>
        ) : (
          <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
            {page.items.map((course) => (
              <article
                key={course.id}
                className="glass group overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl"
              >
                <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-indigo-500/15 p-3 text-indigo-300 ring-1 ring-indigo-400/20">
                      <BookOpen size={22} />
                    </div>
                    <span className="rounded-full bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10">
                      {course.code}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-white">{course.name}</h3>
                  <p className="mt-1.5 text-sm text-slate-400">Academic year {course.academicYear}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                    <Users size={16} className="text-slate-500" />
                    {course.studentCount} students
                  </div>
                </div>
              </article>
            ))}
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

      {showModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <form onSubmit={submit} className="glass w-full max-w-md space-y-4 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Create class</h2>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <input
              className="field"
              placeholder="Class name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Code (e.g. CSC-101)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Academic year"
              value={form.academicYear}
              onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
