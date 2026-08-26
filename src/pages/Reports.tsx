import { useCallback, useEffect, useState } from 'react'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import { AttendanceBadge } from '../components/common/StatusBadge'
import apiClient from '../services/api'
import type { ClassDto, MonthlyReportDto } from '../types'

export function Reports() {
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [classId, setClassId] = useState('')
  const [report, setReport] = useState<MonthlyReportDto>()
  const [error, setError] = useState('')
  const reportYear = new Date().getFullYear()
  const reportMonth = new Date().getMonth() + 1

  const load = useCallback(async () => {
    setError('')
    try {
      const [c, r] = await Promise.all([
        apiClient.get<ClassDto[]>('/classes'),
        apiClient.get<MonthlyReportDto>('/attendance/reports/monthly', {
          params: {
            year: reportYear,
            month: reportMonth,
            classId: classId || undefined,
          },
        }),
      ])
      setClasses(c.data)
      setReport(r.data)
    } catch (e) {
      setError(errorMessage(e, 'Monthly report could not be loaded.'))
    }
  }, [classId, reportMonth, reportYear])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section>
      <PageHeader title="Monthly reports" description="Live monthly attendance percentages." />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      <select
        className="field mb-6 max-w-sm px-4 py-2.5"
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
      >
        <option value="">All classes</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {!report ? (
        <LoadingState label="Loading monthly report..." />
      ) : (
        <article className="glass rounded-2xl p-6 shadow-xl sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                {report.className} · {report.month}/{report.year}
              </h2>
              <p className="mt-1 text-sm text-slate-400">Overall class attendance for the period</p>
            </div>
            <AttendanceBadge percentage={report.overallPercentage} />
          </div>

          <p className="mt-5 text-4xl font-bold tracking-tight text-white">{report.overallPercentage}%</p>

          <div className="mt-6 space-y-1">
            {report.students.map((s) => (
              <div
                key={s.studentId}
                className="flex items-center justify-between gap-4 rounded-xl border border-transparent px-3 py-3 transition hover:border-white/10 hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{s.studentName}</p>
                  <p className="text-xs text-slate-500">
                    Present {s.present} · Late {s.late} · Absent {s.absent}
                  </p>
                </div>
                <AttendanceBadge percentage={s.percentage} />
              </div>
            ))}
          </div>
        </article>
      )}
    </section>
  )
}
