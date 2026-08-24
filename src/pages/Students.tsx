import { PageHeader } from '../components/common/PageHeader'

export function Students() {
  return (
    <section>
      <PageHeader title="Students" description="Manage enrolled students and class assignments." />
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
        Student records will appear here once the API is populated.
      </div>
    </section>
  )
}
