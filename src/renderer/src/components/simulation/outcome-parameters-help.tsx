import { useField } from '@formisch/react'
import { Fragment, type ReactElement } from 'react'

import { treatmentEffects } from '@/lib/design-options'
import type { SimulationFormStore } from '@/types/form-types'

export function OutcomeParametersHelp({
  form
}: {
  form: SimulationFormStore
}): ReactElement | null {
  const outcomeType = useField(form, {
    path: ['outcomeType']
  })

  if (outcomeType.input === 'binary') {
    return (
      <div className=" px-4 pb-4 pt-3 text-sm text-foreground/80">
        <div className="space-y-5">
          <div className="space-y-2">
            <h4 className="font-medium text-primary">Control arm event probability</h4>

            <p className="space-y-2 pl-5 leading-relaxed">
              The probability that patient in the control group experiences the outcome of interest.
              If the control arm event probabilty is 0.4, then about 40% of patients in the control
              group experiences the event of interest
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-primary">Treatment effect</h4>

            <dl className="space-y-2">
              {treatmentEffects.map((effect) => (
                <Fragment key={effect.value}>
                  <dt className="font-medium text-muted-foreground">{effect.label}</dt>
                  <dd className="space-y-2 pl-5 leading-relaxed">{effect.description}</dd>
                </Fragment>
              ))}
            </dl>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-primary">Treatment effect value</h4>

            <p className="space-y-2 pl-5 leading-relaxed">
              The assumed size of the treatment effect used in the simulation. This value is often
              based on previous research, clinical expertise, or the minimum improvement that would
              justify adopting the treatment in practice
            </p>
          </div>
        </div>
      </div>
    )
  } else if (outcomeType.input === 'continuous') {
    return (
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
            <h4 className="font-medium text-primary">Mean Difference for the treatment effect</h4>

            <p className="space-y-2 pl-5 leading-relaxed">
              The difference in the average outcome between treatment and control arms
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
