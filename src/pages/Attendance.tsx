import { Check, CheckCheck, Clock3, LoaderCircle, ShieldCheck, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'
import { useVisibleClasses } from '../hooks/useVisibleClasses'
import apiClient, { markAttendance } from '../services/api'
import type { AttendanceRecordDto, AttendanceStatus, ClassDto, MarkAttendanceRequestDto } from '../types'
import { looksLikeGuid, toLocalDateString } from '../utils/date'

const statuses: AttendanceStatus[] = ['Present', 'Late', 'Absent', 'Excused']

const statusIcons: Record<AttendanceStatus, typeof Check> = {
  Present: Check,
  Late: Clock3,
  Absent: X,
  Excused: ShieldCheck,
}

const statusStyles: Record<
  AttendanceStatus,
  { idle: string; active: string; glow: string; text: string }
> = {
  Present: {
    idle: 'border-emerald-400/25 bg-emerald-500/5 text-emerald-200/75 hover:bg-emerald-500/15 hover:scale-[1.03]',
    active:
      'border-emerald-400/50 bg-gradient-to-br from-emerald-500/35 to-emerald-600/20 text-emerald-50 shadow-[0_0_24px_rgba(16,185,129,0.35)] scale-[1.04]',
    glow: 'bg-emerald-400',
    text: 'text-emerald-300',
  },
  Late: {
    idle: 'border-amber-400/25 bg-amber-500/5 text-amber-200/75 hover:bg-amber-500/15 hover:scale-[1.03]',
    active:
      'border-amber-400/50 bg-gradient-to-br from-amber-500/35 to-amber-600/20 text-amber-50 shadow-[0_0_24px_rgba(245,158,11,0.35)] scale-[1.04]',
    glow: 'bg-amber-400',
    text: 'text-amber-300',
  },
  Absent: {
    idle: 'border-rose-400/25 bg-rose-500/5 text-rose-200/75 hover:bg-rose-500/15 hover:scale-[1.03]',
    active:
      'border-rose-400/50 bg-gradient-to-br from-rose-500/35 to-rose-600/20 text-rose-50 shadow-[0_0_24px_rgba(244,63,94,0.35)] scale-[1.04]',
    glow: 'bg-rose-400',
    text: 'text-rose-300',
  },
  Excused: {
    idle: 'border-sky-400/25 bg-sky-500/5 text-sky-200/75 hover:bg-sky-500/15 hover:scale-[1.03]',
    active:
      'border-sky-400/50 bg-gradient-to-br from-sky-500/35 to-blue-600/20 text-sky-50 shadow-[0_0_24px_rgba(56,189,248,0.4)] scale-[1.04]',
    glow: 'bg-sky-400',
    text: 'text-sky-300',
  },
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function Attendance() {
  const { user, isTeacher } = useAuth()
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(() => toLocalDateString())
  const [records, setRecords] = useState<AttendanceRecordDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const { classes: visibleClasses, label: classLabel, isScopedToAssignments } = useVisibleClasses(classes)
  const assignedClassIds = user?.assignedClassIds

  const selectedClass = useMemo(
    () => visibleClasses.find((c) => c.id === classId),
    [visibleClasses, classId],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiClient.get<ClassDto[]>('/classes')
      setClasses(result.data)
      const scoped =
        isTeacher && assignedClassIds?.length
          ? result.data.filter((c) => assignedClassIds.includes(c.id))
          : result.data
      const selected =
        (classId && scoped.some((c) => c.id === classId) ? classId : undefined) || scoped[0]?.id
      if (selected) {
        setClassId(selected)
        setRecords(
          (
            await apiClient.get<AttendanceRecordDto[]>('/attendance/rollcall', {
              params: { classId: selected, date },
            })
          ).data,
        )
      } else {
        setRecords([])
      }
    } catch (e) {
      setError(errorMessage(e, 'Attendance roll call could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [assignedClassIds, classId, date, isTeacher])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (saveState !== 'saved') return
    const timer = window.setTimeout(() => setSaveState('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [saveState])

  const submitMark = async (payload: MarkAttendanceRequestDto) => {
    console.log('[attendance/mark] records payload', {
      classId: payload.classId,
      date: payload.date,
      records: payload.records,
    })
    const invalid = payload.records.filter((row) => !looksLikeGuid(row.studentId))
    if (invalid.length > 0) {
      console.warn(
        '[attendance/mark] studentId should be a Guid primary key, not an enrollment number',
        invalid,
      )
    }
    await markAttendance(payload)
  }

  const mark = async (record: AttendanceRecordDto, status: AttendanceStatus) => {
    if (record.status === status) return
    setSaveState('saving')
    setError('')
    setRecords((current) =>
      current.map((r) => (r.studentId === record.studentId ? { ...r, status } : r)),
    )
    try {
      await submitMark({
        classId,
        date,
        records: [{ studentId: record.studentId, status }],
      })
      setSaveState('saved')
    } catch (e) {
      setSaveState('error')
      setError(errorMessage(e, 'Attendance status could not be saved.'))
      void load()
    }
  }

  const markAllPresent = async () => {
    if (records.length === 0) return
    const alreadyAllPresent = records.every((record) => record.status === 'Present')
    if (alreadyAllPresent) return

    setSaveState('saving')
    setError('')
    setRecords((current) => current.map((record) => ({ ...record, status: 'Present' as const })))
    try {
      await submitMark({
        classId,
        date,
        records: records.map((record) => ({
          studentId: record.studentId,
          status: 'Present' as const,
        })),
      })
      setSaveState('saved')
    } catch (e) {
      setSaveState('error')
      setError(errorMessage(e, 'Some attendance updates could not be saved.'))
      void load()
    }
  }

  const statusCount = (status: AttendanceStatus) =>
    records.filter((record) => record.status === status).length

  const presentRate =
    records.length === 0
      ? 0
      : Math.round(
          ((statusCount('Present') + statusCount('Late')) / records.length) * 100,
        )

  return (
    <section className="space-y-6">
      <PageHeader
        title="Mark attendance"
        description="Tactile status pills save instantly — use Mark all present for a quick fill."
        action={
          <button className="btn-primary" onClick={() => void load()}>
            <CheckCheck size={18} />
            Refresh roll call
          </button>
        }
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      <div className="glass grid gap-3 rounded-2xl p-4 shadow-xl sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:p-5">
        <div className="min-w-0">
          {isScopedToAssignments && (
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-300">
              {classLabel}
            </p>
          )}
          <select
            className="field max-w-md px-3 py-1.5 text-sm"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            aria-label={classLabel}
          >
            {visibleClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <label className="block text-xs font-medium text-slate-400">
          Date
          <input
            className="mt-1.5 w-44 max-w-xs rounded-lg border border-white/15 bg-slate-950/70 px-3 py-1.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <LoadingState label="Loading roll call..." />
      ) : (
        <div className="glass overflow-hidden rounded-2xl shadow-xl">
          <div className="flex flex-col gap-4 border-b border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/5 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">LIVE ROLL CALL</p>
              <h2 className="mt-1 truncate text-xl font-semibold tracking-tight text-white">
                {selectedClass?.name ?? 'Select a class'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                <span className="font-semibold text-white">{records.length}</span> learners ·{' '}
                <span className="font-semibold text-emerald-300">{presentRate}%</span> present/late
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <span
                    key={status}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${statusStyles[status].idle}`}
                  >
                    <i className={`h-1.5 w-1.5 rounded-full ${statusStyles[status].glow}`} />
                    {statusCount(status)} {status}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => void markAllPresent()}
                  disabled={records.length === 0 || saveState === 'saving'}
                >
                  <CheckCheck size={16} /> Mark all present
                </button>
                <SaveFeedback state={saveState} />
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {records.map((record) => {
              const styles = statusStyles[record.status]
              const roll =
                record.enrollmentNumber ||
                `ID-${record.studentId.slice(0, 6).toUpperCase()}`
              return (
                <div
                  key={record.studentId}
                  className="flex flex-col gap-4 px-4 py-4 transition hover:bg-white/[0.03] sm:px-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3 sm:items-center">
                    <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/25 to-violet-600/20 text-sm font-bold text-indigo-100 ring-1 ring-indigo-400/25">
                      {initials(record.studentName) || <UserRound size={18} />}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-slate-900 ${styles.glow}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold tracking-tight text-white">
                          {record.studentName}
                        </p>
                        <span className="rounded-full border border-white/10 bg-slate-950/50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-slate-300">
                          {roll}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm font-medium ${styles.text}`}>
                        Current: {record.status}
                      </p>
                    </div>
                  </div>

                  <div
                    role="group"
                    aria-label={`Status for ${record.studentName}`}
                    className="grid grid-cols-2 gap-2 sm:inline-flex sm:flex-wrap sm:rounded-2xl sm:border sm:border-white/10 sm:bg-slate-950/40 sm:p-1.5"
                  >
                    {statuses.map((status) => {
                      const active = record.status === status
                      const Icon = statusIcons[status]
                      const tone = statusStyles[status]
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => void mark(record, status)}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 active:scale-95 sm:min-w-[5.5rem] ${
                            active ? tone.active : tone.idle
                          }`}
                        >
                          <Icon size={14} />
                          {status}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {records.length === 0 && (
              <p className="px-5 py-12 text-center text-sm text-slate-500">
                No students in this roll call.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function SaveFeedback({ state }: { state: SaveState }) {
  if (state === 'idle') return null
  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
        <LoaderCircle size={14} className="animate-spin" /> Saving…
      </span>
    )
  }
  if (state === 'error') {
    return <span className="text-xs font-medium text-rose-300">Save failed</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300">
      <Check size={14} /> Saved
    </span>
  )
}
