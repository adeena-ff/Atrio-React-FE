import { PageHeader } from '../components/common/PageHeader'

export function Attendance() {
  return (
    <section>
      <PageHeader title="Attendance" description="Mark and review daily student attendance." />
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
        Attendance marking UI will be connected in a later sprint.
      </div>
    </section>
  )
}
