import { FIELD_LABELS } from '@shared/field-labels'
import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'

export function SampleSizeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold">Sample Size Parameters</h3>
        <p>
          The following inputs specify the sample size parameters for the full study rather than the
          number per arm.
        </p>
      </div>
      <div className="space-y-6">
        <NumericField
          form={form}
          path={['m0']}
          label={FIELD_LABELS.m0}
          min={1}
          step={1}
          className="max-w-lg"
        />
        <NumericField
          form={form}
          path={['m']}
          label={FIELD_LABELS.m}
          min={1}
          step={1}
          className="max-w-lg"
        />
        <NumericField
          form={form}
          path={['N']}
          label={FIELD_LABELS.N}
          min={1}
          step={1}
          className="max-w-lg"
        />

        <div className="space-y-6 border-t pt-6">
          <h3 className="font-semibold">Simulation Parameter</h3>
          <NumericField
            form={form}
            path={['R']}
            label={FIELD_LABELS.R}
            min={1}
            step={1}
            className="max-w-lg"
          />
        </div>
      </div>
    </div>
  )
}
