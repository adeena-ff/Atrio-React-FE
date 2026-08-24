import { PageHeader } from '../components/common/PageHeader'

export function Dashboard() {
  return (
    <section>
      <PageHeader
        title="Dashboard"
        description="Overview of classes, students, and attendance activity."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {['Students', 'Classes', 'Attendance records'].map((label) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold">0</p>
          </article>
        ))}
      </div>
    </section>
  )
}
