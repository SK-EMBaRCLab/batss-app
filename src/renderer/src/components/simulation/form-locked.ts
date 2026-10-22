import { createContext, useContext } from 'react'

// True while a simulation is running, so the form stays read-only and
// always shows the values the current run was started with. Native
// inputs are already covered by the <fieldset disabled> in
// SimulationForm; Base UI controls (Select, Slider) don't see a native
// fieldset, so they read this instead.
export const FormLockedContext = createContext(false)

export function useFormLocked(): boolean {
  return useContext(FormLockedContext)
}
