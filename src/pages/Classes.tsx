import { BookOpen, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ErrorBanner, LoadingState, errorMessage } from '../components/common/AsyncState'
import { PageHeader } from '../components/common/PageHeader'
import apiClient from '../services/api'
import type { ClassDto } from '../types'

export function Classes() {
  const [classes, setClasses] = useState<ClassDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setClasses((await apiClient.get<ClassDto[]>('/classes')).data)
    } catch (e) {
      setError(errorMessage(e, 'Classes could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section>
      <PageHeader title="Class management" description="Active courses and their live student rosters." />

      {error && <ErrorBanner message={error} retry={() => void load()} />}

      {loading ? (
        <LoadingState label="Loading classes..." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((course) => (
            <article
              key={course.id}
              className="glass group overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl"
            >
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-2xl bg-indigo-500/15 p-3 text-indigo-300 ring-1 ring-indigo-400/20">
                    <BookOpen size={22} />
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                    {course.code}
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-semibold tracking-tight text-white">{course.name}</h2>
                <p className="mt-1.5 text-sm text-slate-400">Academic year {course.academicYear}</p>

                <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-sky-200">
                    <Users size={14} />
                    {course.studentCount} students
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
