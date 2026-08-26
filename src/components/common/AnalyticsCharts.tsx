import type { StudentMonthlyRowDto } from '../../types'

const tone = (percentage: number) => percentage < 75 ? '#fb7185' : percentage < 85 ? '#fbbf24' : '#34d399'

export function AttendanceTrend({ rows, title = 'Attendance by learner' }: { rows: StudentMonthlyRowDto[]; title?: string }) {
  const visibleRows = [...rows].sort((a, b) => a.percentage - b.percentage).slice(0, 8)

  return (
    <article className="glass rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">MONTHLY TREND</p>
          <h2 className="mt-1 font-semibold tracking-tight text-white">{title}</h2>
        </div>
        <span className="text-xs text-slate-500">Target 75%</span>
      </div>
      {visibleRows.length === 0 ? (
        <p className="mt-10 text-center text-sm text-slate-500">No attendance data for this period.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {visibleRows.map((row) => (
            <div key={row.studentId} className="grid grid-cols-[minmax(88px,1fr)_minmax(120px,2.1fr)_42px] items-center gap-3 text-xs">
              <p className="truncate font-medium text-slate-300">{row.studentName}</p>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-950/70">
                <div className="absolute inset-y-0 left-[75%] z-10 w-px bg-white/35" />
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${row.percentage}%`, backgroundColor: tone(row.percentage) }} />
              </div>
              <p className="text-right font-semibold text-white">{row.percentage}%</p>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export function AttendanceDistribution({ rows, label = 'Attendance health' }: { rows: StudentMonthlyRowDto[]; label?: string }) {
  const atRisk = rows.filter((row) => row.percentage < 75).length
  const watch = rows.filter((row) => row.percentage >= 75 && row.percentage < 85).length
  const healthy = rows.filter((row) => row.percentage >= 85).length
  const total = rows.length || 1
  const healthyEnd = (healthy / total) * 100
  const watchEnd = healthyEnd + (watch / total) * 100
  const background = `conic-gradient(#34d399 0 ${healthyEnd}%, #fbbf24 ${healthyEnd}% ${watchEnd}%, #fb7185 ${watchEnd}% 100%)`

  return (
    <article className="glass rounded-2xl p-5 shadow-xl">
      <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">COHORT HEALTH</p>
      <h2 className="mt-1 font-semibold tracking-tight text-white">{label}</h2>
      <div className="mt-6 flex items-center gap-5">
        <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background }}>
          <div className="grid h-20 w-20 place-items-center rounded-full bg-slate-900 text-center">
            <span className="text-2xl font-bold text-white">{rows.length}</span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400">learners</span>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <Legend color="bg-emerald-400" label="Healthy" value={healthy} />
          <Legend color="bg-amber-400" label="Watch" value={watch} />
          <Legend color="bg-rose-400" label="At risk" value={atRisk} />
        </div>
      </div>
    </article>
  )
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return <div className="flex items-center justify-between gap-5 text-slate-400"><span className="flex items-center gap-2"><i className={`h-2 w-2 rounded-full ${color}`} />{label}</span><strong className="text-white">{value}</strong></div>
}
