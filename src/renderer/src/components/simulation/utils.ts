import { getDeepErrorEntries } from '@formisch/react'

import { designSchema } from '@/lib/schema'

type ErrorEntry = ReturnType<typeof getDeepErrorEntries<typeof designSchema>>[number]

export function hasFieldError(errors: ErrorEntry[], path: string): boolean {
  return errors.some((error) => error.path.length > 0 && error.path[0] === path)
}

export function hasAnyFieldError(errors: ErrorEntry[], paths: string[]): boolean {
  return paths.some((path) => hasFieldError(errors, path))
}
