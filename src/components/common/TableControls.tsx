import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'

export interface FilterOption {
  value: string
  label: string
}

export interface TableFilterConfig {
  id: string
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
  allLabel?: string
}

interface TableControlsProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: TableFilterConfig[]
  children?: ReactNode
}

interface PaginationBarProps {
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageSizeOptions?: number[]
}

const PAGE_SIZES = [10, 25, 50]

export function TableControls({
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  children,
}: TableControlsProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5">
      <div className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          className="field field-with-icon pr-10"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={searchPlaceholder}
        />
        {search && (
          <button
            type="button"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {filters.map((filter) => (
        <select
          key={filter.id}
          className="field w-full px-3 py-2.5 text-sm sm:w-48"
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          aria-label={filter.label}
        >
          <option value="">{filter.allLabel ?? `All ${filter.label.toLowerCase()}`}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}

      {children}
    </div>
  )
}

export function PaginationBar({
  pageNumber,
  pageSize,
  totalCount,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZES,
}: PaginationBarProps) {
  const start = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1
  const end = Math.min(pageNumber * pageSize, totalCount)
  const pagePills = buildPagePills(pageNumber, totalPages)

  return (
    <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="text-xs text-slate-400 sm:text-sm">
        Showing <span className="font-semibold text-slate-200">{start}</span>–
        <span className="font-semibold text-slate-200">{end}</span> of{' '}
        <span className="font-semibold text-slate-200">{totalCount}</span> entries
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Rows
          <select
            className="rounded-lg border border-white/15 bg-slate-950/70 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn-secondary cursor-pointer px-2.5 py-1.5 text-xs transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={!hasPreviousPage}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
          Prev
        </button>

        <div className="flex items-center gap-1">
          {pagePills.map((pill, index) =>
            pill === '…' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-xs text-slate-500">
                …
              </span>
            ) : (
              <button
                key={pill}
                type="button"
                onClick={() => onPageChange(pill)}
                className={`min-w-8 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                  pill === pageNumber
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'border border-white/10 bg-slate-950/40 text-slate-300 hover:bg-white/5'
                }`}
                aria-current={pill === pageNumber ? 'page' : undefined}
                aria-label={`Page ${pill}`}
              >
                {pill}
              </button>
            ),
          )}
        </div>

        <button
          type="button"
          className="btn-secondary cursor-pointer px-2.5 py-1.5 text-xs transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={!hasNextPage}
          aria-label="Next page"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl">
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="grid animate-pulse gap-3 border-t border-white/5 px-5 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, col) => (
              <div
                key={col}
                className="h-4 rounded-md bg-slate-800/80"
                style={{ width: col === 0 ? '70%' : '55%' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function buildPagePills(current: number, total: number): Array<number | '…'> {
  if (total <= 1) return total === 1 ? [1] : []
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pills: Array<number | '…'> = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) pills.push('…')
  for (let page = start; page <= end; page += 1) pills.push(page)
  if (end < total - 1) pills.push('…')
  pills.push(total)
  return pills
}
