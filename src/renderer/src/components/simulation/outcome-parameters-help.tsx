import { useField } from '@formisch/react'
import { Fragment, type ReactElement } from 'react'

import { treatmentEffects } from '@/lib/design-options'
import type { SimulationFormStore } from '@/types/form-types'

import { HelpPanel, HelpSection } from './help-panel'

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
      <HelpPanel>
        <HelpSection title="Control arm event probability">
          <p className="pl-5 leading-relaxed">
            The probability that a patient in the control group experiences the outcome of interest.
            If the control arm event probability is 0.4, then about 40% of patients in the control
            group experience the event of interest.
          </p>
        </HelpSection>

        <HelpSection title="Treatment effect">
          <dl className="space-y-2">
            {treatmentEffects.map((effect) => (
              <Fragment key={effect.value}>
                <dt className="font-medium text-muted-foreground">{effect.label}</dt>
                <dd className="space-y-2 pl-5 leading-relaxed">{effect.description}</dd>
              </Fragment>
            ))}
          </dl>
        </HelpSection>

        <HelpSection title="Treatment effect value">
          <p className="pl-5 leading-relaxed">
            The assumed size of the treatment effect used in the simulation. This value is often
            based on previous research, clinical expertise, or the minimum improvement that would
            justify adopting the treatment in practice
          </p>
        </HelpSection>
      </HelpPanel>
    )
  } else if (outcomeType.input === 'continuous') {
    return (
      <HelpPanel>
        <HelpSection title="Mean Outcome in Control arm">
          <p className="pl-5 leading-relaxed">
            The average outcome for participants receiving the control intervention
          </p>
        </HelpSection>

        <HelpSection title="Standard Deviation of Outcome">
          <p className="pl-5 leading-relaxed">
            A measure of individual variation around the mean outcome
          </p>
        </HelpSection>

        <HelpSection title="Mean Difference for the treatment effect">
          <p className="pl-5 leading-relaxed">
            The difference in the average outcome between treatment and control arms
          </p>
        </HelpSection>
      </HelpPanel>
    )
  }

  return null
}
