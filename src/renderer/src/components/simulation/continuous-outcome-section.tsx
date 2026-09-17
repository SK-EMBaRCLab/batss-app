import { type ReactElement } from 'react'

import { CollapsibleInfoPanel } from '@/components/common/collapsible-info-panel'
import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'

export function ContinuousOutcomeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Continuous Outcome Parameters</h3>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <NumericField form={form} path={['meanOutcome']} label="Mean Outcome in Control arm" />

          <NumericField form={form} path={['sd']} label="Standard Deviation of Outcome" />

          <NumericField
            form={form}
            path={['meanDiff']}
            label="Mean Difference for the treatment effect"
          />
        </div>
        <CollapsibleInfoPanel title="About Outcome Parameters">
          <div className="border-t border-primary/10 px-4 pb-4 pt-3 text-sm text-foreground/80">
            <div className="space-y-5">
              <div className="space-y-2">
                <h4 className="font-medium text-primary">Mean Outcome in Control arm</h4>

                <p className="space-y-2 pl-5 leading-relaxed">
                  The average outcome for participants receiving the control intervention
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Standard Deviation of Outcome</h4>
                <p className="space-y-2 pl-5 leading-relaxed">
                  A measure of individual variation around the mean outcome
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">
                  Mean Difference for the treatment effect
                </h4>

                <p className="space-y-2 pl-5 leading-relaxed">
                  The difference in the average outcome between treatment and control arms
                </p>
              </div>
            </div>
          </div>
        </CollapsibleInfoPanel>
      </div>
    </div>
  )
}
