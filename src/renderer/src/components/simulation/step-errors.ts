// When a field's errors are shown. formisch validates the whole form on
// every blur and keystroke and writes errors to every field, including
// those on steps not reached yet, so each step would open already marked
// red. A field shows its errors once it has been touched, or once Next (or
// a jump past it) has been tried on its step.
import { createContext, useContext } from 'react'

type Errors = [string, ...string[]] | null

/** Whether Next has been tried on the step this field is in. Set by the form per step. */
export const StepAttemptedContext = createContext(false)

/** A field's errors, or null while they shouldn't be shown yet. */
export function shownErrors(errors: Errors, touched: boolean, attempted: boolean): Errors {
  return touched || attempted ? errors : null
}

/** Whether Next has been tried on the step being rendered. */
export function useStepAttempted(): boolean {
  return useContext(StepAttemptedContext)
}
