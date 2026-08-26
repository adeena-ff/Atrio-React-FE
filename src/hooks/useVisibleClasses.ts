import type { ClassDto } from '../types'
import { useAuth } from '../context/AuthContext'

/**
 * Returns classes visible to the current user.
 * Teachers with `assignedClassIds` only see those courses; otherwise the full list is returned
 * (backend may already scope `/classes` for teachers).
 */
export function useVisibleClasses(classes: ClassDto[] | null | undefined) {
  const { isTeacher, user } = useAuth()
  const list = Array.isArray(classes) ? classes : []
  const assignedIds = user?.assignedClassIds

  if (!isTeacher || !assignedIds?.length) {
    return {
      classes: list,
      isScopedToAssignments: Boolean(isTeacher),
      label: isTeacher ? 'Your assigned courses' : 'All classes',
    }
  }

  const assigned = new Set(assignedIds)
  return {
    classes: list.filter((c) => assigned.has(c.id)),
    isScopedToAssignments: true,
    label: 'Your assigned courses',
  }
}
