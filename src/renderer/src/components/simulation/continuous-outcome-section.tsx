import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'

export function ContinuousOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Continuous Outcome Parameters</h3>
      <div className="space-y-6">
        <NumericField form={form} path={['meanOutcome']} label="Mean Outcome in Control arm" />

        <NumericField form={form} path={['sd']} label="Standard Deviation of Outcome" />

        <NumericField
          form={form}
          path={['meanDiff']}
          label="Mean Difference for the treatment effect"
        />
      </div>
    </div>
  )
}
