import { BarChart3, Download } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import {
  ChartSkeleton,
  CourseHeatBarChart,
  CourseRadarChart,
  StatusDonutChart,
} from '../components/common/AnalyticsCharts'
import { notify } from '../components/common/AppToaster'
import { PageHeader } from '../components/common/PageHeader'
import { AttendanceBadge } from '../components/common/StatusBadge'
import { PaginationBar, TableControls, TableSkeleton } from '../components/common/TableControls'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useVisibleClasses } from '../hooks/useVisibleClasses'
import apiClient, { getReportsAnalytics } from '../services/api'
import type { ClassDto, ReportsAnalyticsDto, StudentMonthlyRowDto } from '../types'
import { daysAgoLocal, toLocalDateString } from '../utils/date'
import { paginateLocally } from '../utils/pagination'

const dateInputClass =
  'w-full max-w-xs rounded-lg border border-white/15 bg-slate-950/70 px-3 py-1.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30'

type ReportStudentRow = StudentMonthlyRowDto & { className: string; classId: string }

export function Reports() {
  const { isAdmin, isTeacher } = useAuth()
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [classId, setClassId] = useState('')
  const [startDate, setStartDate] = useState(() => daysAgoLocal(60))
  const [endDate, setEndDate] = useState(() => toLocalDateString())
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [report, setReport] = useState<ReportsAnalyticsDto | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const { classes: visibleClasses, label: classLabel, isScopedToAssignments } = useVisibleClasses(classes)
  const debouncedSearch = useDebouncedValue(search, 300)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const classResult = await apiClient.get<ClassDto[]>('/classes')
      setClasses(classResult.data ?? [])
      const analytics = await getReportsAnalytics(startDate, endDate, classId || undefined, {
        search: debouncedSearch,
        status: status || undefined,
        pageNumber,
        pageSize,
      })
      setReport(analytics ?? null)
    } catch (e) {
      const message = errorMessage(e, 'Reports analytics could not be loaded.')
      setError(message)
      setReport(null)
      notify.error(message)
    } finally {
      setLoading(false)
    }
  }, [classId, debouncedSearch, endDate, pageNumber, pageSize, startDate, status])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPageNumber(1)
  }, [debouncedSearch, status, classId, startDate, endDate])

  const kpis = {
    totalEvents: report?.kpis?.totalEvents ?? 0,
    activeLearners: report?.kpis?.activeLearners ?? 0,
    systemAveragePercentage: report?.kpis?.systemAveragePercentage ?? 0,
    atRiskCount: report?.kpis?.atRiskCount ?? 0,
  }
  const statusDistribution = report?.statusDistribution ?? []
  const coursePerformance = report?.coursePerformance ?? []
  const courseRadar = report?.courseRadar ?? []
  const classBreakdown = report?.classBreakdown ?? []
  const studentHistories = report?.studentHistories ?? []

  const flatStudents = useMemo(() => {
    const rows: ReportStudentRow[] = classBreakdown.flatMap((course) =>
      (course?.students ?? []).map((student) => ({
        ...student,
        className: course?.className ?? 'Class',
        classId: course?.classId ?? '',
      })),
    )

    let filtered = rows
    const term = debouncedSearch.trim().toLowerCase()
    if (term) {
      filtered = filtered.filter(
        (row) =>
          row.studentName.toLowerCase().includes(term) ||
          row.enrollmentNumber.toLowerCase().includes(term) ||
          row.className.toLowerCase().includes(term),
      )
    }
    if (status === 'at-risk') filtered = filtered.filter((row) => row.percentage < 75)
    if (status === 'watch') filtered = filtered.filter((row) => row.percentage >= 75 && row.percentage < 85)
    if (status === 'healthy') filtered = filtered.filter((row) => row.percentage >= 85)

    return paginateLocally(filtered, pageNumber, pageSize)
  }, [classBreakdown, debouncedSearch, pageNumber, pageSize, status])

  const isEmptyReport =
    !!report &&
    statusDistribution.length === 0 &&
    coursePerformance.length === 0 &&
    classBreakdown.length === 0 &&
    kpis.totalEvents === 0

  const exportCsv = () => {
    if (!report) return
    const rows = [
      ['Class', 'Student', 'Enrollment', 'Present', 'Late', 'Absent', 'Excused', 'Percentage'],
      ...classBreakdown.flatMap((course) =>
        (course?.students ?? []).map((s) => [
          course?.className ?? '',
          s?.studentName ?? '',
          s?.enrollmentNumber ?? '',
          String(s?.present ?? 0),
          String(s?.late ?? 0),
          String(s?.absent ?? 0),
          String(s?.excused ?? 0),
          String(s?.percentage ?? 0),
        ]),
      ),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `atrio-attendance-${startDate}-to-${endDate}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    notify.success('CSV export ready')
  }

  const timelineStudents = useMemo(() => studentHistories.slice(0, 6), [studentHistories])

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
            <button
              type="button"
              className="btn-primary cursor-pointer transition-all duration-200 active:scale-95"
              onClick={exportCsv}
              disabled={!report || isEmptyReport}
            >
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
            className={`${dateInputClass} mt-1.5`}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="block text-xs font-medium text-slate-400">
          End date
          <input
            className={`${dateInputClass} mt-1.5`}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <label className="block text-xs font-medium text-slate-400 sm:col-span-2">
          {isScopedToAssignments ? classLabel : 'Class filter'}
          <select
            className="field mt-1.5 max-w-md px-3 py-1.5 text-sm"
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

      {loading ? (
        <div className="space-y-6">
          <LoadingState label="Loading reports analytics..." />
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : !report && !error ? (
        <EmptyReportsBanner />
      ) : !report ? null : isEmptyReport ? (
        <EmptyReportsBanner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Total events" value={kpis.totalEvents} />
            <Kpi label="Active learners" value={kpis.activeLearners} />
            <Kpi
              label={isTeacher ? 'Class average' : 'System average'}
              value={`${kpis.systemAveragePercentage}%`}
            />
            <Kpi label="At-risk count" value={kpis.atRiskCount} tone="text-rose-300" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {isAdmin ? (
              <>
                <StatusDonutChart
                  data={statusDistribution}
                  title="60-day status distribution"
                  subtitle={`${report?.startDate ?? startDate} → ${report?.endDate ?? endDate}`}
                />
                <CourseHeatBarChart
                  data={coursePerformance}
                  title="Course attendance heatmap"
                  subtitle="Average % by course"
                />
              </>
            ) : (
              <>
                <CourseRadarChart
                  data={courseRadar.length ? courseRadar : coursePerformance}
                  title="Course performance breakdown"
                  subtitle="Present / Late / Absent / Excused rates"
                />
                <StatusDonutChart
                  data={statusDistribution}
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
                    key={student?.studentId ?? student?.enrollmentNumber}
                    className="rounded-2xl border border-white/10 bg-slate-950/35 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{student?.studentName ?? 'Student'}</p>
                        <p className="text-xs text-slate-500">{student?.enrollmentNumber}</p>
                      </div>
                      <AttendanceBadge percentage={student?.percentage ?? 0} />
                    </div>
                    <ol className="mt-4 space-y-2 border-l border-white/10 pl-4">
                      {(student?.timeline ?? []).slice(0, 5).map((point, index) => (
                        <li key={`${point?.date}-${index}`} className="relative text-xs text-slate-400">
                          <span className="absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full bg-indigo-400" />
                          <span className="font-medium text-slate-200">{point?.date}</span>
                          {' · '}
                          {point?.status} · {point?.className}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </article>
          )}

          <div className="glass overflow-hidden rounded-2xl shadow-xl">
            <div className="border-b border-white/10 px-4 py-4 sm:px-5">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                {isTeacher ? 'Class attendance breakdown' : 'Learner detail table'}
              </h2>
              <p className="mt-1 text-sm text-slate-400">Search and filter learners across the selected report window.</p>
            </div>

            <TableControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by student name or ID..."
              filters={[
                {
                  id: 'status',
                  label: 'Attendance band',
                  value: status,
                  onChange: setStatus,
                  allLabel: 'All bands',
                  options: [
                    { value: 'healthy', label: 'Healthy (≥85%)' },
                    { value: 'watch', label: 'Watch (75–84%)' },
                    { value: 'at-risk', label: 'At risk (<75%)' },
                  ],
                },
              ]}
            />

            {loading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : flatStudents.items.length === 0 ? (
              <p className="px-5 py-12 text-center text-sm text-slate-500">No learners match your filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-950/40 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold sm:px-5">Student</th>
                      <th className="px-3 py-3 font-semibold">Class</th>
                      <th className="px-3 py-3 font-semibold">Enrollment</th>
                      <th className="px-3 py-3 font-semibold">P / L / A / E</th>
                      <th className="px-4 py-3 font-semibold sm:px-5">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatStudents.items.map((s) => (
                      <tr
                        key={`${s.classId}-${s.studentId}`}
                        className="border-t border-white/5 text-slate-300 hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-3 font-medium text-white sm:px-5">{s.studentName}</td>
                        <td className="px-3 py-3">{s.className}</td>
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
            )}

            <PaginationBar
              pageNumber={flatStudents.pageNumber}
              pageSize={flatStudents.pageSize}
              totalCount={flatStudents.totalCount}
              totalPages={flatStudents.totalPages}
              hasPreviousPage={flatStudents.hasPreviousPage}
              hasNextPage={flatStudents.hasNextPage}
              onPageChange={setPageNumber}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPageNumber(1)
              }}
            />
          </div>
        </>
      )}
    </section>
  )
}

function EmptyReportsBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`glass rounded-2xl border border-dashed border-white/15 text-center shadow-xl ${
        compact ? 'p-8' : 'p-10'
      }`}
    >
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20">
        <BarChart3 size={22} />
      </div>
      <p className="font-semibold text-white">No report data for this range</p>
      <p className="mt-1 text-sm text-slate-400">
        Try widening the date range or selecting another class. Charts and tables will populate once attendance
        events exist.
      </p>
    </div>
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
