import { Download } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import {
  ChartSkeleton,
  CourseHeatBarChart,
  CourseRadarChart,
  StatusDonutChart,
} from '../components/common/AnalyticsCharts'
import { PageHeader } from '../components/common/PageHeader'
import { AttendanceBadge } from '../components/common/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { useVisibleClasses } from '../hooks/useVisibleClasses'
import apiClient, { getReportsAnalytics } from '../services/api'
import type { ClassDto, ReportsAnalyticsDto } from '../types'

function daysAgoIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export function Reports() {
  const { isAdmin, isTeacher } = useAuth()
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [classId, setClassId] = useState('')
  const [startDate, setStartDate] = useState(() => daysAgoIso(60))
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState<ReportsAnalyticsDto>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { classes: visibleClasses, label: classLabel, isScopedToAssignments } = useVisibleClasses(classes)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const classResult = await apiClient.get<ClassDto[]>('/classes')
      setClasses(classResult.data)
      const analytics = await getReportsAnalytics(startDate, endDate, classId || undefined)
      setReport(analytics)
    } catch (e) {
      setError(errorMessage(e, 'Reports analytics could not be loaded.'))
      setReport(undefined)
    } finally {
      setLoading(false)
    }
  }, [classId, endDate, startDate])

  useEffect(() => {
    void load()
  }, [load])

  const exportCsv = () => {
    if (!report) return
    const rows = [
      ['Class', 'Student', 'Enrollment', 'Present', 'Late', 'Absent', 'Excused', 'Percentage'],
      ...report.classBreakdown.flatMap((course) =>
        course.students.map((s) => [
          course.className,
          s.studentName,
          s.enrollmentNumber,
          String(s.present),
          String(s.late),
          String(s.absent),
          String(s.excused),
          String(s.percentage),
        ]),
      ),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `atrio-attendance-${startDate}-to-${endDate}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const timelineStudents = useMemo(
    () => report?.studentHistories?.slice(0, 6) ?? [],
    [report?.studentHistories],
  )

  return (
    <section className="space-y-6">
      <PageHeader
        title={isTeacher ? 'Your course analytics' : 'Historical reports'}
        description={
          isTeacher
            ? 'Course performance, student history timeline, and scoped class breakdowns.'
            : '60-day distribution, course heatmap, KPIs, and CSV export for deeper analysis.'
        }
        action={
          isAdmin ? (
            <button type="button" className="btn-primary" onClick={exportCsv} disabled={!report}>
              <Download size={18} />
              Export CSV
            </button>
          ) : undefined
        }
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      <div className="glass grid gap-3 rounded-2xl p-4 shadow-xl sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
        <label className="block text-xs font-medium text-slate-400">
          Start date
          <input
            className="field mt-1.5 px-4 py-2.5"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="block text-xs font-medium text-slate-400">
          End date
          <input
            className="field mt-1.5 px-4 py-2.5"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <label className="block text-xs font-medium text-slate-400 sm:col-span-2 lg:col-span-2">
          {isScopedToAssignments ? classLabel : 'Class filter'}
          <select
            className="field mt-1.5 px-4 py-2.5"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            aria-label={classLabel}
          >
            {!isTeacher && <option value="">All classes</option>}
            {visibleClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading || !report ? (
        <div className="space-y-6">
          {loading && <LoadingState label="Loading reports analytics..." />}
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Total events" value={report.kpis.totalEvents} />
            <Kpi label="Active learners" value={report.kpis.activeLearners} />
            <Kpi
              label={isTeacher ? 'Class average' : 'System average'}
              value={`${report.kpis.systemAveragePercentage}%`}
            />
            <Kpi label="At-risk count" value={report.kpis.atRiskCount} tone="text-rose-300" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {isAdmin ? (
              <>
                <StatusDonutChart
                  data={report.statusDistribution}
                  title="60-day status distribution"
                  subtitle={`${report.startDate} → ${report.endDate}`}
                />
                <CourseHeatBarChart
                  data={report.coursePerformance}
                  title="Course attendance heatmap"
                  subtitle="Average % by course"
                />
              </>
            ) : (
              <>
                <CourseRadarChart
                  data={report.courseRadar?.length ? report.courseRadar : report.coursePerformance}
                  title="Course performance breakdown"
                  subtitle="Present / Late / Absent / Excused rates"
                />
                <StatusDonutChart
                  data={report.statusDistribution}
                  title="Your status mix"
                  subtitle="Scoped to assigned classes"
                />
              </>
            )}
          </div>

          {isTeacher && timelineStudents.length > 0 && (
            <article className="glass rounded-2xl p-4 shadow-xl sm:p-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">STUDENT HISTORY</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Timeline</h2>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {timelineStudents.map((student) => (
                  <div
                    key={student.studentId}
                    className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{student.studentName}</p>
                        <p className="text-xs text-slate-500">{student.enrollmentNumber}</p>
                      </div>
                      <AttendanceBadge percentage={student.percentage} />
                    </div>
                    <ol className="mt-4 space-y-2 border-l border-white/10 pl-4">
                      {student.timeline.slice(0, 5).map((point, index) => (
                        <li key={`${point.date}-${index}`} className="relative text-xs text-slate-400">
                          <span className="absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full bg-indigo-400" />
                          <span className="font-medium text-slate-200">{point.date}</span>
                          {' · '}
                          {point.status} · {point.className}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </article>
          )}

          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-white">
              {isTeacher ? 'Class attendance breakdown' : 'Course detail tables'}
            </h2>
            {report.classBreakdown.map((course) => (
              <article key={course.classId} className="glass overflow-hidden rounded-2xl shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-5">
                  <div>
                    <p className="font-semibold text-white">
                      {course.className}{' '}
                      <span className="text-sm font-normal text-slate-500">({course.code})</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      P {course.present} · L {course.late} · A {course.absent} · E {course.excused}
                    </p>
                  </div>
                  <AttendanceBadge percentage={course.percentage} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-950/40 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold sm:px-5">Student</th>
                        <th className="px-3 py-3 font-semibold">Enrollment</th>
                        <th className="px-3 py-3 font-semibold">P / L / A / E</th>
                        <th className="px-4 py-3 font-semibold sm:px-5">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.students.map((s) => (
                        <tr
                          key={s.studentId}
                          className="border-t border-white/5 text-slate-300 hover:bg-white/[0.03]"
                        >
                          <td className="px-4 py-3 font-medium text-white sm:px-5">{s.studentName}</td>
                          <td className="px-3 py-3">{s.enrollmentNumber}</td>
                          <td className="px-3 py-3 text-xs">
                            {s.present} / {s.late} / {s.absent} / {s.excused}
                          </td>
                          <td className="px-4 py-3 sm:px-5">
                            <AttendanceBadge percentage={s.percentage} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function Kpi({
  label,
  value,
  tone = 'text-white',
}: {
  label: string
  value: string | number
  tone?: string
}) {
  return (
    <div className="glass rounded-2xl border border-white/10 p-4 shadow-xl">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${tone}`}>{value}</p>
    </div>
  )
}
