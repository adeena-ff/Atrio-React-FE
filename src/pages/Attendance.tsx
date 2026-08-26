import { CheckCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import apiClient from '../services/api'
import type { AttendanceRecordDto, AttendanceStatus, ClassDto } from '../types'

const statuses: AttendanceStatus[] = ['Present', 'Late', 'Absent', 'Excused']

const statusStyles: Record<AttendanceStatus, { idle: string; active: string }> = {
  Present: {
    idle: 'border-emerald-400/20 bg-emerald-500/5 text-emerald-200/70 hover:bg-emerald-500/10',
    active: 'border-emerald-400/40 bg-emerald-500/25 text-emerald-100 shadow-lg shadow-emerald-950/40',
  },
  Late: {
    idle: 'border-amber-400/20 bg-amber-500/5 text-amber-200/70 hover:bg-amber-500/10',
    active: 'border-amber-400/40 bg-amber-500/25 text-amber-100 shadow-lg shadow-amber-950/40',
  },
  Absent: {
    idle: 'border-rose-400/20 bg-rose-500/5 text-rose-200/70 hover:bg-rose-500/10',
    active: 'border-rose-400/40 bg-rose-500/25 text-rose-100 shadow-lg shadow-rose-950/40',
  },
  Excused: {
    idle: 'border-sky-400/20 bg-sky-500/5 text-sky-200/70 hover:bg-sky-500/10',
    active: 'border-sky-400/40 bg-sky-500/25 text-sky-100 shadow-lg shadow-sky-950/40',
  },
}

export function Attendance() {
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [records, setRecords] = useState<AttendanceRecordDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await apiClient.get<ClassDto[]>('/classes')
      setClasses(result.data)
      const selected = classId || result.data[0]?.id
      if (selected) {
        setClassId(selected)
        setRecords(
          (
            await apiClient.get<AttendanceRecordDto[]>('/attendance/rollcall', {
              params: { classId: selected, date },
            })
          ).data,
        )
      }
    } catch (e) {
      setError(errorMessage(e, 'Attendance roll call could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [classId, date])

  useEffect(() => {
    void load()
  }, [load])

  const mark = async (record: AttendanceRecordDto, status: AttendanceStatus) => {
    if (record.status === status) return
    setRecords((current) =>
      current.map((r) => (r.studentId === record.studentId ? { ...r, status } : r)),
    )
    try {
      await apiClient.post('/attendance/mark', {
        studentId: record.studentId,
        classId,
        attendanceDate: date,
        status,
      })
    } catch (e) {
      setError(errorMessage(e, 'Attendance status could not be saved.'))
      void load()
    }
  }

  return (
    <section>
      <PageHeader
        title="Mark attendance"
        description="Select Present, Late, Absent, or Excused for each student — changes save immediately."
        action={
          <button className="btn-primary" onClick={() => void load()}>
            <CheckCheck size={18} />
            Refresh roll call
          </button>
        }
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      <div className="glass mb-6 grid gap-3 rounded-2xl p-4 shadow-xl sm:grid-cols-2 sm:p-5">
        <select
          className="field px-4 py-2.5"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="field px-4 py-2.5"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingState label="Loading roll call..." />
      ) : (
        <div className="glass overflow-hidden rounded-2xl shadow-xl">
          {records.map((record) => (
            <div
              key={record.studentId}
              className="flex flex-col gap-3 border-b border-white/5 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <p className="font-medium tracking-tight text-white">{record.studentName}</p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {statuses.map((status) => {
                  const active = record.status === status
                  const styles = statusStyles[status]
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void mark(record, status)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 sm:min-w-22 ${
                        active ? styles.active : styles.idle
                      }`}
                    >
                      {status}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
