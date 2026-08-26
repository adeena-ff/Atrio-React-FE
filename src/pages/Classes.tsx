import { BookOpen, Plus, Users, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ErrorBanner, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import { PaginationBar, TableControls, TableSkeleton } from '../components/common/TableControls'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useVisibleClasses } from '../hooks/useVisibleClasses'
import { getClassesPage } from '../services/api'
import apiClient from '../services/api'
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
  const [department, setDepartment] = useState('')
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
      const result = await getClassesPage({
        search: debouncedSearch,
        department: department || undefined,
        status: status || undefined,
        pageNumber,
        pageSize,
      })
      setPage(result)
      const years = Array.from(
        new Set(
          (
            await apiClient.get<ClassDto[] | PagedResultDto<ClassDto>>('/classes').then((r) =>
              Array.isArray(r.data) ? r.data : (r.data.items ?? []),
            )
          ).map((c) => c.academicYear),
        ),
      ).sort()
      setYearOptions(years)
    } catch (e) {
      setError(errorMessage(e, 'Classes could not be loaded.'))
      setPage(emptyPage(pageNumber, pageSize))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, department, pageNumber, pageSize, status])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPageNumber(1)
  }, [debouncedSearch, department, status])

  const departmentFilters = useMemo(
    () => yearOptions.map((year) => ({ value: year, label: `Year ${year}` })),
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
            <button type="button" className="btn-primary cursor-pointer transition-all duration-200 active:scale-95" onClick={() => setShowModal(true)}>
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
          filters={[
            {
              id: 'department',
              label: 'Academic year',
              value: department,
              onChange: setDepartment,
              allLabel: 'All years',
              options: departmentFilters,
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
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                      {course.code}
                    </span>
                  </div>

                  <h2 className="mt-5 text-lg font-semibold tracking-tight text-white">{course.name}</h2>
                  <p className="mt-1.5 text-sm text-slate-400">Academic year {course.academicYear}</p>

                  <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-sky-200">
                      <Users size={14} />
                      {course.studentCount} students
                    </span>
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
            <h2 className="text-xl font-bold tracking-tight text-white">Create a class</h2>
            <div className="mt-5 grid gap-3">
              <input
                required
                className="field px-4 py-2.5"
                placeholder="Class name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                required
                className="field px-4 py-2.5"
                placeholder="Class code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <input
                required
                className="field px-4 py-2.5"
                placeholder="Academic year"
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">Save class</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
