import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import {
  ChartSkeleton,
  CourseBreakdownChart,
  DailyTrendChart,
} from '../components/common/AnalyticsCharts'
import { PageHeader } from '../components/common/PageHeader'
import { AttendanceBadge } from '../components/common/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { getDashboardAnalytics } from '../services/api'
import type { DashboardAnalyticsDto } from '../types'

export function Dashboard() {
  const { isAdmin, isTeacher } = useAuth()
  const [data, setData] = useState<DashboardAnalyticsDto>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await getDashboardAnalytics())
    } catch (e) {
      setError(errorMessage(e, 'Dashboard analytics could not be loaded.'))
      setData(undefined)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const metrics = data?.metrics

  return (
    <section className="space-y-8">
      <PageHeader
        title={isTeacher ? 'Your teaching dashboard' : 'Attendance at a glance'}
        description={
          isTeacher
            ? 'Real-time view of your classes today, weekly course comparison, and students needing attention.'
            : 'Operational metrics, 30-day trends, departmental breakdown, and at-risk cohort alerts.'
        }
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      {loading || !data || !metrics ? (
        <div className="space-y-6">
          <LoadingState label="Loading dashboard analytics..." />
          <div className="grid gap-6 xl:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        </div>
      ) : (
        <>
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label={isTeacher ? 'My learners' : 'Total students'}
              value={metrics.totalStudents}
              detail="Active student records"
              icon={Users}
              tone="bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20"
            />
            <MetricCard
              label="Today's attendance"
              value={`${metrics.todayAttendancePercentage}%`}
              detail="Present and late records"
              icon={CheckCircle2}
              tone="bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20"
            />
            <MetricCard
              label={isTeacher ? 'My classes' : 'Active classes'}
              value={metrics.activeClasses}
              detail="Available for roll call"
              icon={BookOpen}
              tone="bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20"
            />
            <MetricCard
              label="Needs attention"
              value={metrics.atRiskCount}
              detail="Below 75% attendance"
              icon={AlertTriangle}
              tone="bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20"
            />
          </div>

          {isTeacher && data.myClassesToday && data.myClassesToday.length > 0 && (
            <article className="glass rounded-2xl p-4 shadow-xl sm:p-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">MY CLASSES TODAY</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Roll-call completion gauges
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.myClassesToday.map((course) => (
                  <Link
                    key={course.classId}
                    to="/attendance"
                    className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 transition hover:-translate-y-0.5 hover:border-indigo-400/30 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{course.className}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{course.code}</p>
                      </div>
                      <span className="text-lg font-bold text-indigo-200">{course.percentage}%</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, course.percentage)}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {course.markedCount}/{course.studentCount} marked
                    </p>
                  </Link>
                ))}
              </div>
            </article>
          )}

          <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <DailyTrendChart
              data={data.dailyTrend}
              title={isAdmin ? '30-day daily attendance trend' : 'Your recent attendance trend'}
              subtitle={isAdmin ? 'Institution-wide presence rate' : 'Across your assigned courses'}
            />
            <CourseBreakdownChart
              data={data.courseBreakdown}
              title={isAdmin ? 'Departmental breakdown' : 'Weekly course comparison'}
              subtitle={isAdmin ? 'Average attendance by course' : 'This week vs your classes'}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
            <article className="glass rounded-2xl p-4 shadow-xl sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-rose-300">AT-RISK COHORT</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                    {isTeacher ? 'Students needing attention' : 'Urgent list (<75%)'}
                  </h2>
                </div>
                <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200">
                  {data.atRiskStudents.length} flagged
                </span>
              </div>

              {data.atRiskStudents.length === 0 ? (
                <p className="mt-8 inline-flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 size={17} />
                  No students currently below the threshold.
                </p>
              ) : (
                <div className="mt-5 space-y-2">
                  {data.atRiskStudents.slice(0, 8).map((student) => (
                    <div
                      key={student.studentId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-3 transition hover:border-rose-400/20"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{student.studentName}</p>
                        <p className="truncate text-xs text-slate-500">
                          {student.className} · {student.enrollmentNumber}
                        </p>
                      </div>
                      <AttendanceBadge percentage={student.percentage} />
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="glass rounded-2xl p-4 shadow-xl sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">
                    TODAY&apos;S WORKSPACE
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                    Keep attendance moving
                  </h2>
                </div>
                <div className="rounded-2xl bg-indigo-500/15 p-3 text-indigo-300 ring-1 ring-indigo-400/20">
                  <CalendarCheck size={22} />
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <Link
                  className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 to-violet-500/10 p-4 transition hover:-translate-y-0.5 hover:border-indigo-400/35"
                  to="/attendance"
                >
                  <ClipboardList className="text-indigo-300" size={20} />
                  <p className="mt-3 font-semibold text-white">Mark roll call</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-indigo-300">
                    Open attendance <ArrowRight size={15} />
                  </span>
                </Link>
                <Link
                  className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/15 to-cyan-500/10 p-4 transition hover:-translate-y-0.5 hover:border-sky-400/35"
                  to="/reports"
                >
                  <Users className="text-sky-300" size={20} />
                  <p className="mt-3 font-semibold text-white">Deep-dive reports</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-sky-300">
                    Open reports <ArrowRight size={15} />
                  </span>
                </Link>
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  )
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string
  value: string | number
  detail: string
  icon: typeof Users
  tone: string
}) {
  return (
    <article className="glass group flex h-full flex-col rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tone}`}>
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-auto pt-5 text-xs leading-relaxed text-slate-500">{detail}</p>
    </article>
  )
}
