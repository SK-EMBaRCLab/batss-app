import { getDeepErrorEntries } from '@formisch/react'

import { designSchema } from '@/lib/schema'

type ErrorEntry = ReturnType<typeof getDeepErrorEntries<typeof designSchema>>[number]

export function hasFieldError(errors: ErrorEntry[], path: string): boolean {
  return errors.some((error) => error.path.length > 0 && error.path[0] === path)
}

export function hasAnyFieldError(errors: ErrorEntry[], paths: string[]): boolean {
  return paths.some((path) => hasFieldError(errors, path))
}

/**
 * The first step from `from` up to (not including) `to` that has
 * problems, or null if they're all fine. Moving forward checks every step
 * it passes, so a jump can't skip a step that was made invalid.
 */
export function firstInvalidStep(
  from: number,
  to: number,
  isValid: (index: number) => boolean
): number | null {
  for (let index = from; index < to; index++) {
    if (!isValid(index)) return index
  }
  return null
}
