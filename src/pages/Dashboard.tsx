import { AlertTriangle, ArrowRight, BookOpen, CalendarCheck, CheckCircle2, ClipboardList, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import { AttendanceDistribution, AttendanceTrend } from '../components/common/AnalyticsCharts'
import { PageHeader } from '../components/common/PageHeader'
import { useAuth } from '../context/AuthContext'
import apiClient from '../services/api'
import type { ClassDto, DashboardDto, MonthlyReportDto } from '../types'

const cards = [
  { key: 'totalStudents', label: 'Total students', icon: Users, tone: 'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/20', detail: 'Active student records' },
  { key: 'todayAttendancePercentage', label: "Today's attendance", icon: CheckCircle2, tone: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20', detail: 'Present and late records' },
  { key: 'activeClasses', label: 'Active classes', icon: BookOpen, tone: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20', detail: 'Available for roll call' },
  { key: 'lowAttendanceAlerts', label: 'Needs attention', icon: AlertTriangle, tone: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20', detail: 'Below 75% attendance' },
] as const

export function Dashboard() {
  const { isTeacher, user } = useAuth()
  const [data, setData] = useState<DashboardDto>()
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReportDto>()
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [dashboard, classes] = await Promise.all([
        apiClient.get<DashboardDto>('/dashboard'),
        apiClient.get<ClassDto[]>('/classes'),
      ])
      const scopedClasses = isTeacher && user?.assignedClassIds?.length
        ? classes.data.filter((course) => user.assignedClassIds?.includes(course.id))
        : classes.data
      const reportRequests = (isTeacher ? scopedClasses.map((course) => course.id) : [undefined]).map((classId) =>
        apiClient.get<MonthlyReportDto>('/attendance/reports/monthly', {
          params: { year: new Date().getFullYear(), month: new Date().getMonth() + 1, classId },
        }),
      )
      const reports = await Promise.all(reportRequests)
      const rows = reports.flatMap((report) => report.data.students)
      const report = reports[0]?.data
      setData(dashboard.data)
      if (report) {
        setMonthlyReport({
          ...report,
          className: isTeacher ? 'Your assigned courses' : report.className,
          overallPercentage: rows.length ? Math.round(rows.reduce((total, row) => total + row.percentage, 0) / rows.length * 100) / 100 : 0,
          students: rows,
        })
      }
    } catch (e) {
      setError(errorMessage(e, 'Dashboard data could not be loaded.'))
    }
  }, [isTeacher, user?.assignedClassIds])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="space-y-8">
      <PageHeader
        title={isTeacher ? 'Your teaching dashboard' : 'Attendance at a glance'}
        description={isTeacher ? 'A live view of your first assigned course and today’s roll-call workspace.' : 'A live view of the people, classes, and attendance that need your attention.'}
      />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      {!data ? (
        <LoadingState label="Loading dashboard..." />
      ) : (
        <>
          <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ key, label, icon: Icon, tone, detail }) => {
              const value = data[key]
              return (
                <article
                  key={key}
                  className="glass group flex h-full flex-col rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-400">{label}</p>
                      <p className="mt-3 text-4xl font-bold tracking-tight text-white">
                        {key === 'todayAttendancePercentage' ? `${value}%` : value}
                      </p>
                    </div>
                    <div className={`rounded-2xl p-3 ${tone}`}>
                      <Icon size={22} />
                    </div>
                  </div>
                  <p className="mt-auto pt-5 text-xs leading-relaxed text-slate-500">{detail}</p>
                </article>
              )
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
            <article className="glass rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">TODAY&apos;S WORKSPACE</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Keep attendance moving</h2>
                </div>
                <div className="rounded-2xl bg-indigo-500/15 p-3 text-indigo-300 ring-1 ring-indigo-400/20">
                  <CalendarCheck size={22} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  className="rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 to-violet-500/10 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/35 hover:shadow-lg hover:shadow-indigo-950/40"
                  to="/attendance"
                >
                  <ClipboardList className="text-indigo-300" size={20} />
                  <p className="mt-4 font-semibold text-white">Mark roll call</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">Select a class and date to record attendance.</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-300">
                    Open attendance <ArrowRight size={15} />
                  </span>
                </Link>

                <Link
                  className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/15 to-cyan-500/10 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-400/35 hover:shadow-lg hover:shadow-sky-950/40"
                  to="/students"
                >
                  <Users className="text-sky-300" size={20} />
                  <p className="mt-4 font-semibold text-white">Manage students</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">Search records or add a new student.</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-300">
                    Open students <ArrowRight size={15} />
                  </span>
                </Link>
              </div>
            </article>

            <article className="glass rounded-2xl p-6 shadow-xl">
              <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">ATTENDANCE HEALTH</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Follow-up queue</h2>
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-5">
                <p className="text-4xl font-bold tracking-tight text-white">{data.lowAttendanceAlerts}</p>
                <p className="mt-1 text-sm text-slate-400">students currently below the 75% threshold</p>
                {data.lowAttendanceAlerts > 0 ? (
                  <Link to="/reports" className="btn-secondary mt-5 text-sm">
                    Review reports <ArrowRight size={15} />
                  </Link>
                ) : (
                  <p className="mt-5 inline-flex items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 size={17} />
                    No current follow-ups
                  </p>
                )}
              </div>
            </article>
          </div>

          {monthlyReport && (
            <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
              <AttendanceTrend
                rows={monthlyReport.students}
                title={isTeacher ? 'Your course — attendance watchlist' : 'Institution — attention watchlist'}
              />
              <AttendanceDistribution
                rows={monthlyReport.students}
                label={isTeacher ? 'Your assigned course' : 'All-class monthly cohort'}
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}
