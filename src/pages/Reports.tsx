import { PageHeader } from '../components/common/PageHeader'

export function Reports() {
  return (
    <section>
      <PageHeader title="Reports" description="Attendance summaries and export-ready insights." />
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
        Reporting views will be added after core attendance flows are complete.
      </div>
    </section>
  )
}
