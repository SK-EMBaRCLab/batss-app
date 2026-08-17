import { type ReactElement } from 'react'
import { useField } from '@formisch/react'

import type { SimulationFormStore } from '@/components/types'
import { BinaryOutcomeSection } from './binary-outcome-section'
import { ContinuousOutcomeSection } from './continuous-outcome-section'

export function OutcomeParametersSection({
  form
}: {
  form: SimulationFormStore
}): ReactElement | null {
  const outcomeType = useField(form, {
    path: ['outcomeType']
  })

  if (outcomeType.input === 'binary') {
    return <BinaryOutcomeSection form={form} />
  } else if (outcomeType.input === 'continuous') {
    return <ContinuousOutcomeSection form={form} />
  }

  return null
}
