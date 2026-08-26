import { Pencil, Plus, UserMinus, UsersRound, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import { createTeacher, deactivateTeacher, getTeachers, updateTeacher } from '../services/api'
import apiClient from '../services/api'
import type { ClassDto, CreateTeacherDto, TeacherDto, UpdateTeacherDto } from '../types'

const emptyForm: CreateTeacherDto = {
  fullName: '',
  email: '',
  password: '',
  assignedClassIds: [],
}

export function Teachers() {
  const [teachers, setTeachers] = useState<TeacherDto[]>([])
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<TeacherDto | null>(null)
  const [form, setForm] = useState<CreateTeacherDto>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [teacherList, classList] = await Promise.all([
        getTeachers(),
        apiClient.get<ClassDto[]>('/classes').then((r) => r.data),
      ])
      setTeachers(teacherList)
      setClasses(classList)
    } catch (e) {
      setError(errorMessage(e, 'Teachers could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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

  const toggleClass = (classId: string) => {
    setForm((current) => ({
      ...current,
      assignedClassIds: current.assignedClassIds.includes(classId)
        ? current.assignedClassIds.filter((id) => id !== classId)
        : [...current.assignedClassIds, classId],
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
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus size={18} />
            Add Teacher
          </button>
        }
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      {loading ? (
        <LoadingState label="Loading teachers..." />
      ) : teachers.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20">
            <UsersRound size={22} />
          </div>
          <p className="font-semibold text-white">No teachers yet</p>
          <p className="mt-1 text-sm text-slate-400">Add a teacher profile and assign their classes.</p>
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl shadow-xl">
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
                {teachers.map((teacher) => (
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
                          teacher.assignedClassIds.map((classId) => {
                            const assignedClass = classes.find((c) => c.id === classId)
                            return (
                            <span
                              key={classId}
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
                      <span
                        className={`status-pill ${teacher.isActive ? 'status-high' : 'status-low'}`}
                      >
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="btn-secondary px-3 py-2 text-xs"
                          onClick={() => openEdit(teacher)}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        {teacher.isActive && (
                          <button
                            type="button"
                            className="btn-secondary px-3 py-2 text-xs text-rose-200"
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
        </div>
      )}

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
