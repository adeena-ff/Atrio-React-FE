export function attendanceTone(percentage: number) {
  if (percentage > 85) return 'status-high'
  if (percentage >= 75) return 'status-mid'
  return 'status-low'
}

export function AttendanceBadge({ percentage }: { percentage: number }) {
  return <span className={`status-pill ${attendanceTone(percentage)}`}>{percentage}%</span>
}
