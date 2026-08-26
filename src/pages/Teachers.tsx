import { Activity, GraduationCap, Pencil, Plus, UserMinus, UsersRound, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ErrorBanner, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import { PaginationBar, TableControls, TableSkeleton } from '../components/common/TableControls'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { createTeacher, deactivateTeacher, getClassOptions, getTeachers, updateTeacher } from '../services/api'
import type { ClassDto, CreateTeacherDto, PagedResultDto, TeacherDto, UpdateTeacherDto } from '../types'
import { emptyPage } from '../utils/pagination'

const emptyForm: CreateTeacherDto = {
  fullName: '',
  email: '',
  password: '',
  assignedClassIds: [],
}

export function Teachers() {
  const [page, setPage] = useState<PagedResultDto<TeacherDto>>(emptyPage())
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [search, setSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [status, setStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<TeacherDto | null>(null)
  const [form, setForm] = useState<CreateTeacherDto>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const debouncedSearch = useDebouncedValue(search, 300)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [teacherPage, classList] = await Promise.all([
        getTeachers({
          search: debouncedSearch,
          classId: classId || undefined,
          status: status || undefined,
          pageNumber,
          pageSize,
        }),
        getClassOptions(),
      ])
      setPage(teacherPage)
      setClasses(classList)
    } catch (e) {
      setError(errorMessage(e, 'Teachers could not be loaded.'))
      setPage(emptyPage(pageNumber, pageSize))
    } finally {
      setLoading(false)
    }
  }, [classId, debouncedSearch, pageNumber, pageSize, status])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPageNumber(1)
  }, [debouncedSearch, classId, status])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (teacher: TeacherDto) => {
    setEditing(teacher)
    setForm({
      fullName: teacher.fullName,
      email: teacher.email,
      password: '',
      assignedClassIds: teacher.assignedClassIds,
    })
    setShowModal(true)
  }

  const toggleClass = (id: string) => {
    setForm((current) => ({
      ...current,
      assignedClassIds: current.assignedClassIds.includes(id)
        ? current.assignedClassIds.filter((value) => value !== id)
        : [...current.assignedClassIds, id],
    }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (editing) {
        const payload: UpdateTeacherDto = {
          fullName: form.fullName,
          email: form.email,
          assignedClassIds: form.assignedClassIds,
          isActive: editing.isActive,
        }
        await updateTeacher(editing.id, payload)
      } else {
        await createTeacher(form)
      }
      setShowModal(false)
      setEditing(null)
      setForm(emptyForm)
      await load()
    } catch (e) {
      setError(errorMessage(e, editing ? 'Teacher could not be updated.' : 'Teacher could not be created.'))
    } finally {
      setSubmitting(false)
    }
  }

  const onDeactivate = async (teacher: TeacherDto) => {
    if (!window.confirm(`Deactivate ${teacher.fullName}? They will no longer be able to sign in.`)) return
    setError('')
    try {
      await deactivateTeacher(teacher.id)
      await load()
    } catch (e) {
      setError(errorMessage(e, 'Teacher could not be deactivated.'))
    }
  }

  return (
    <section>
      <PageHeader
        title="Teacher Management"
        description="Create, assign, and manage teacher profiles."
        action={
          <button type="button" className="btn-primary cursor-pointer transition-all duration-200 active:scale-95" onClick={openCreate}>
            <Plus size={18} />
            Add Teacher
          </button>
        }
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      <div className="glass overflow-hidden rounded-2xl shadow-xl">
        <TableControls
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or email..."
          onClearFilters={() => {
            setSearch('')
            setClassId('')
            setStatus('')
          }}
          filters={[
            {
              id: 'class',
              label: 'Assigned class',
              value: classId,
              onChange: setClassId,
              allLabel: 'All classes',
              icon: GraduationCap,
              options: classes.map((c) => ({ value: c.id, label: c.name })),
            },
            {
              id: 'status',
              label: 'Status',
              value: status,
              onChange: setStatus,
              allLabel: 'All statuses',
              icon: Activity,
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
        />

        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : page.items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20">
              <UsersRound size={22} />
            </div>
            <p className="font-semibold text-white">No teachers match your filters</p>
            <p className="mt-1 text-sm text-slate-400">Try clearing search or status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-950/40 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Name</th>
                  <th className="px-4 py-4 font-semibold">Email</th>
                  <th className="px-4 py-4 font-semibold">Assigned classes</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((teacher) => (
                  <tr
                    key={teacher.id}
                    className="border-t border-white/5 text-slate-300 transition hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-4 font-medium text-white">{teacher.fullName}</td>
                    <td className="px-4 py-4">{teacher.email}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {teacher.assignedClassIds.length === 0 ? (
                          <span className="text-xs text-slate-500">None assigned</span>
                        ) : (
                          teacher.assignedClassIds.map((id) => {
                            const assignedClass = classes.find((c) => c.id === id)
                            return (
                              <span
                                key={id}
                                className="rounded-full border border-indigo-400/25 bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-200"
                              >
                                {assignedClass?.code ?? 'Assigned class'}
                              </span>
                            )
                          })
                        )}
                        <span className="self-center text-xs text-slate-500">
                          ({teacher.assignedClassIds.length})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`status-pill ${teacher.isActive ? 'status-high' : 'status-low'}`}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn-secondary cursor-pointer px-3 py-2 text-xs transition-all duration-200 active:scale-95"
                          onClick={() => openEdit(teacher)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        {teacher.isActive && (
                          <button
                            type="button"
                            className="btn-secondary cursor-pointer px-3 py-2 text-xs text-rose-200 transition-all duration-200 active:scale-95"
                            onClick={() => void onDeactivate(teacher)}
                          >
                            <UserMinus size={14} />
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

      {showModal && (
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
            <h2 className="text-xl font-bold tracking-tight text-white">
              {editing ? 'Edit teacher' : 'Add a teacher'}
            </h2>

            <div className="mt-5 grid gap-3">
              <input
                required
                className="field px-4 py-2.5"
                placeholder="Full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <input
                required
                type="email"
                className="field px-4 py-2.5"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {!editing && (
                <input
                  required
                  type="password"
                  className="field px-4 py-2.5"
                  placeholder="Temporary password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={8}
                />
              )}
            </div>

            <p className="mt-5 text-sm font-medium text-slate-300">Assign classes</p>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/40 p-3">
              {classes.length === 0 ? (
                <p className="text-xs text-slate-500">No classes available.</p>
              ) : (
                classes.map((c) => (
                  <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.assignedClassIds.includes(c.id)}
                      onChange={() => toggleClass(c.id)}
                      className="rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span>
                      {c.name} <span className="text-slate-500">({c.code})</span>
                    </span>
                  </label>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editing ? 'Save changes' : 'Create teacher'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
