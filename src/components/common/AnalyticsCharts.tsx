import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyAttendancePointDto, NamedMetricDto } from '../../types'

const tooltipStyle = {
  background: 'rgba(15, 23, 42, 0.95)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#e2e8f0',
  fontSize: 12,
}

const STATUS_COLORS: Record<string, string> = {
  Present: '#34d399',
  Late: '#fbbf24',
  Absent: '#fb7185',
  Excused: '#818cf8',
  Healthy: '#34d399',
  Watch: '#fbbf24',
  'At risk': '#fb7185',
}

const CHART_PALETTE = ['#6366f1', '#38bdf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa', '#22d3ee']

export function ChartSkeleton({ label = 'Loading chart...' }: { label?: string }) {
  return (
    <div className="flex h-64 animate-pulse flex-col justify-end gap-3 rounded-2xl border border-white/5 bg-slate-950/40 p-4">
      <div className="flex flex-1 items-end gap-2">
        {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-slate-800/80" style={{ height: `${h}%` }} />
        ))}
      </div>
      <p className="text-center text-xs text-slate-500">{label}</p>
    </div>
  )
}

function ChartCard({
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
}: {
  eyebrow: string
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <article className={`glass rounded-2xl p-4 shadow-xl sm:p-5 ${className}`}>
      <div className="mb-4">
        <p className="text-xs font-semibold tracking-[0.14em] text-indigo-300">{eyebrow}</p>
        <h2 className="mt-1 text-base font-semibold tracking-tight text-white sm:text-lg">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-500 sm:text-sm">{subtitle}</p>}
      </div>
      {children}
    </article>
  )
}

export function DailyTrendChart({
  data,
  title = 'Daily attendance trend',
  subtitle = 'Last 30 days',
}: {
  data: DailyAttendancePointDto[]
  title?: string
  subtitle?: string
}) {
  return (
    <ChartCard eyebrow="TREND" title={title} subtitle={subtitle}>
      <div className="h-56 w-full min-w-0 sm:h-64">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v: string) => v.slice(5)}
                axisLine={false}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value) => [`${value}%`, 'Attendance']}
                labelFormatter={(label) => `Date ${label}`}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="#818cf8"
                strokeWidth={2.5}
                fill="url(#trendFill)"
                activeDot={{ r: 5, fill: '#a5b4fc' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  )
}

export function CourseBreakdownChart({
  data,
  title = 'Course breakdown',
  subtitle,
}: {
  data: NamedMetricDto[]
  title?: string
  subtitle?: string
}) {
  return (
    <ChartCard eyebrow="COMPARISON" title={title} subtitle={subtitle}>
      <div className="h-56 w-full min-w-0 sm:h-64">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Attendance']} />
              <Bar dataKey="value" radius={[8, 8, 4, 4]} maxBarSize={42}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  )
}

export function StatusDonutChart({
  data,
  title = 'Status distribution',
  subtitle,
}: {
  data: NamedMetricDto[]
  title?: string
  subtitle?: string
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <ChartCard eyebrow="DISTRIBUTION" title={title} subtitle={subtitle}>
      <div className="h-56 w-full min-w-0 sm:h-64">
        {total === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={3}
                stroke="rgba(15,23,42,0.8)"
                strokeWidth={2}
              >
                {data.map((entry) => (
                  <Cell key={entry.id || entry.name} fill={STATUS_COLORS[entry.name] ?? CHART_PALETTE[0]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  )
}

export function CourseRadarChart({
  data,
  title = 'Course performance',
  subtitle,
}: {
  data: NamedMetricDto[]
  title?: string
  subtitle?: string
}) {
  return (
    <ChartCard eyebrow="PERFORMANCE" title={title} subtitle={subtitle}>
      <div className="h-56 w-full min-w-0 sm:h-64">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(148,163,184,0.2)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Rate" dataKey="value" stroke="#818cf8" fill="#6366f1" fillOpacity={0.35} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Rate']} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  )
}

export function CourseHeatBarChart({
  data,
  title = 'Course attendance heatmap',
  subtitle,
}: {
  data: NamedMetricDto[]
  title?: string
  subtitle?: string
}) {
  return (
    <ChartCard eyebrow="HEATMAP" title={title} subtitle={subtitle}>
      <div className="h-56 w-full min-w-0 sm:h-64">
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={88} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value}%`, 'Attendance']} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={18}>
                {data.map((entry, i) => (
                  <Cell
                    key={entry.id || i}
                    fill={entry.value < 75 ? '#fb7185' : entry.value < 85 ? '#fbbf24' : '#34d399'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  )
}

function EmptyChart() {
  return <div className="grid h-full place-items-center text-sm text-slate-500">No chart data for this period.</div>
}
