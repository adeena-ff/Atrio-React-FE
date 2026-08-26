import { useCallback, useEffect, useState } from 'react'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import { AttendanceBadge } from '../components/common/StatusBadge'
import { AttendanceDistribution, AttendanceTrend } from '../components/common/AnalyticsCharts'
import { useAuth } from '../context/AuthContext'
import { useVisibleClasses } from '../hooks/useVisibleClasses'
import apiClient from '../services/api'
import type { ClassDto, MonthlyReportDto } from '../types'

export function Reports() {
  const { isTeacher, user } = useAuth()
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [classId, setClassId] = useState('')
  const [report, setReport] = useState<MonthlyReportDto>()
  const [error, setError] = useState('')
  const reportYear = new Date().getFullYear()
  const reportMonth = new Date().getMonth() + 1
  const { classes: visibleClasses, label: classLabel, isScopedToAssignments } = useVisibleClasses(classes)

  const load = useCallback(async () => {
    setError('')
    try {
      const c = await apiClient.get<ClassDto[]>('/classes')
      setClasses(c.data)
      const teacherClasses = isTeacher && user?.assignedClassIds?.length
        ? c.data.filter((course) => user.assignedClassIds?.includes(course.id))
        : c.data
      const selectedClassId = isTeacher
        ? ((classId && teacherClasses.some((course) => course.id === classId)) ? classId : teacherClasses[0]?.id ?? '')
        : classId
      if (selectedClassId !== classId) setClassId(selectedClassId)
      const r = await apiClient.get<MonthlyReportDto>('/attendance/reports/monthly', {
        params: { year: reportYear, month: reportMonth, classId: selectedClassId || undefined },
      })
      setReport(r.data)
    } catch (e) {
      setError(errorMessage(e, 'Monthly report could not be loaded.'))
    }
  }, [classId, isTeacher, reportMonth, reportYear, user?.assignedClassIds])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section>
      <PageHeader
        title="Monthly reports"
        description={isTeacher ? 'A focused view of your assigned-course attendance.' : 'Institution-wide attendance health, refreshed from live records.'}
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      <div className="mb-6 max-w-sm">
        {isScopedToAssignments && (
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-indigo-300">{classLabel}</p>
        )}
        <select
          className="field px-4 py-2.5"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          aria-label={classLabel}
        >
          {!isTeacher && <option value="">{isScopedToAssignments ? classLabel : 'All classes'}</option>}
          {visibleClasses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

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

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric label="Learners" value={report.students.length} />
            <Metric label="At risk" value={report.students.filter((student) => student.percentage < 75).length} tone="text-rose-300" />
            <Metric label="Attendance events" value={report.students.reduce((total, student) => total + student.present + student.late + student.absent + student.excused, 0)} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <AttendanceTrend rows={report.students} title={isTeacher ? 'Learners needing your attention' : 'Lowest attendance in this report'} />
            <AttendanceDistribution rows={report.students} label={isTeacher ? 'Your course health' : 'Institutional health'} />
          </div>

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

function Metric({ label, value, tone = 'text-white' }: { label: string; value: number; tone?: string }) {
  return <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4"><p className="text-xs font-medium text-slate-500">{label}</p><p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p></div>
}
