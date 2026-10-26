import { FIELD_LABELS } from '@shared/field-labels'
import { type ReactElement } from 'react'

import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'

export function ContinuousOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Continuous Outcome Parameters</h3>
      <div className="space-y-6">
        <NumericField form={form} path={['meanOutcome']} label={FIELD_LABELS.meanOutcome} />

        <NumericField form={form} path={['sd']} label={FIELD_LABELS.sd} />

        <NumericField form={form} path={['meanDiff']} label={FIELD_LABELS.meanDiff} />
      </div>
    </div>
  )
}
