import { type ReactElement } from 'react'

import { CollapsibleInfoPanel } from '@/components/common/collapsible-info-panel'
import type { SimulationFormStore } from '@/types/form-types'

import { NumericField } from './numeric-field'

export function SampleSizeSection({ form }: { form: SimulationFormStore }): ReactElement {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Sample Size Parameters</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
        <CollapsibleInfoPanel title="About Sample Size Parameters">
          <div className="border-t border-primary/10 px-4 pb-4 pt-3 text-sm text-foreground/80">
            <div className="space-y-5">
              <div className="space-y-2">
                <h4 className="font-medium text-primary">Burn-in</h4>

                <p className="space-y-2 pl-5 leading-relaxed">
                  The number of patients that must be enrolled before the trial may adapt based on
                  accumulating data. Larger burn-in periods provide more initial data to inform
                  adaptive decisions but delay adaptation.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Patients between interim analyses</h4>

                <p className="space-y-2 pl-5 leading-relaxed">
                  The number of patients enrolled analyses of the accumulating trial data. Smaller
                  values allow the trial to response more quickly to new evidence but require more
                  frequent analyses.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Maximum sample size</h4>

                <p className="space-y-2 pl-5 leading-relaxed">
                  The maximum number of participants that the trial can enroll. This may be
                  determined based on funding constraints.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-primary">Number of simulated trials</h4>

                <p className="space-y-2 pl-5 leading-relaxed">
                  The number of trial simulations used to evaluate the operating characteristics of
                  the design, At least 1,000 simulations are recommended for reliable estimates, but
                  smaller values may be useful during model development or tuning to reduce
                  computation time.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleInfoPanel>
      </div>
    </div>
  )
}
