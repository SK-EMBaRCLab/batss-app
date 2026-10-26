import { FIELD_LABELS } from '@shared/field-labels'
import { type ReactElement } from 'react'

import { HelpPanel, HelpSection } from './help-panel'

export function SampleSizeHelp(): ReactElement {
  return (
    <HelpPanel>
      <HelpSection title={FIELD_LABELS.m0}>
        <p className="pl-5 leading-relaxed">
          The number of patients that must be enrolled before the trial may adapt based on
          accumulating data. Larger burn-in periods provide more initial data to inform adaptive
          decisions but delay adaptation.
        </p>
      </HelpSection>

      <HelpSection title={FIELD_LABELS.m}>
        <p className="pl-5 leading-relaxed">
          The number of patients enrolled between analyses of the accumulating trial data. Smaller
          values allow the trial to respond more quickly to new evidence but require more frequent
          analyses.
        </p>
      </HelpSection>

      <HelpSection title={FIELD_LABELS.N}>
        <p className="pl-5 leading-relaxed">
          The maximum number of participants that the trial can enroll. This may be determined based
          on funding constraints.
        </p>
      </HelpSection>

      <HelpSection title={FIELD_LABELS.R}>
        <p className="pl-5 leading-relaxed">
          The number of trial simulations used to evaluate the operating characteristics of the
          design. At least 1,000 simulations are recommended for reliable estimates, but smaller
          values may be useful during model development or tuning to reduce computation time.
        </p>
      </HelpSection>
    </HelpPanel>
  )
}
