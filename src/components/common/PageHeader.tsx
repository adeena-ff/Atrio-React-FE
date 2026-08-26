import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      {action}
    </header>
  )
}
