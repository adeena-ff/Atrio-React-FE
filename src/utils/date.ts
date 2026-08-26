/** Local calendar date as YYYY-MM-DD (avoids UTC offset shifting from toISOString). */
export function toLocalDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function daysAgoLocal(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toLocalDateString(date)
}

const GUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function looksLikeGuid(value: string): boolean {
  return GUID_PATTERN.test(value)
}
