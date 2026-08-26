export interface PagedResultDto<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface ListQueryParams {
  search?: string
  classId?: string
  status?: string
  department?: string
  pageNumber?: number
  pageSize?: number
}

export function emptyPage<T>(pageNumber = 1, pageSize = 10): PagedResultDto<T> {
  return {
    items: [],
    pageNumber,
    pageSize,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  }
}

/** Slice a full array into a paged envelope (fallback when API returns unpaged lists). */
export function paginateLocally<T>(
  items: T[],
  pageNumber: number,
  pageSize: number,
): PagedResultDto<T> {
  const safePage = Math.max(1, pageNumber)
  const safeSize = Math.max(1, pageSize)
  const totalCount = items.length
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / safeSize)
  const start = (safePage - 1) * safeSize
  const pageItems = items.slice(start, start + safeSize)

  return {
    items: pageItems,
    pageNumber: safePage,
    pageSize: safeSize,
    totalCount,
    totalPages,
    hasPreviousPage: safePage > 1 && totalPages > 0,
    hasNextPage: safePage < totalPages,
  }
}

/** Accept either a paged envelope or a raw array from the API. */
export function normalizePagedResult<T>(
  data: PagedResultDto<T> | T[],
  pageNumber: number,
  pageSize: number,
): PagedResultDto<T> {
  if (Array.isArray(data)) {
    return paginateLocally(data, pageNumber, pageSize)
  }

  return {
    items: data.items ?? [],
    pageNumber: data.pageNumber ?? pageNumber,
    pageSize: data.pageSize ?? pageSize,
    totalCount: data.totalCount ?? data.items?.length ?? 0,
    totalPages:
      data.totalPages ??
      (data.totalCount ? Math.ceil(data.totalCount / (data.pageSize || pageSize)) : 0),
    hasPreviousPage: data.hasPreviousPage ?? (data.pageNumber ?? pageNumber) > 1,
    hasNextPage:
      data.hasNextPage ??
      (data.pageNumber ?? pageNumber) <
        (data.totalPages ??
          Math.ceil((data.totalCount ?? 0) / (data.pageSize || pageSize))),
  }
}
