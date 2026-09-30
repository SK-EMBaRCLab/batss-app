import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'

export function SampleSizeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Sample Size Parameters</h3>
      <div className="space-y-6">
        <NumericField
          form={form}
          path={['m0']}
          label="Burn-in"
          min={1}
          step={1}
          className="max-w-lg"
        />
        <NumericField
          form={form}
          path={['m']}
          label="Patients between interim analyses"
          min={1}
          step={1}
          className="max-w-lg"
        />
        <NumericField
          form={form}
          path={['N']}
          label="Maximum sample size"
          min={1}
          step={1}
          className="max-w-lg"
        />

        <div className="space-y-6 border-t pt-6">
          <h3 className="font-semibold">Simulation Parameter</h3>
          <NumericField
            form={form}
            path={['R']}
            label="Number of simulated trials"
            min={1}
            step={1}
            className="max-w-lg"
          />
        </div>
      </div>
    </div>
  )
}
