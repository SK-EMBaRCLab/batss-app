import { FIELD_LABELS } from '@shared/field-labels'
import { type ReactElement } from 'react'

import { HelpPanel, HelpSection } from './help-panel'

export function DecisionRuleHelp(): ReactElement {
  return (
    <HelpPanel>
      <p className="leading-relaxed">
        Decision rules are predefined conditions that determine whether the trial adapts. When a
        rule is met, a pre-specified action takes place, such as stopping or modifying the trial.
      </p>

      <HelpSection title="Superiority">
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            A superiority rule tests whether one arm appears better than the other (or all others).
          </li>
          <li>
            In this two-arm design, meeting the superiority criterion will stop the trial early and
            declare the treatment arm superior to the control arm.
          </li>
        </ul>
      </HelpSection>

      <HelpSection title="Futility">
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            A futility rule stops a study early if the probability of eventually demonstrating
            superiority is low.
          </li>
          <li>
            In this two-arm design, meeting the futility rule will stop the trial early, indicating
            that continuing the trial is unlikely to change the trial conclusion.
          </li>
        </ul>
      </HelpSection>

      <HelpSection title={FIELD_LABELS.superiorityMargin}>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            The minimum treatment difference that is clinically meaningful. Trials typically
            evaluate if there is any treatment benefit by using a superiority margin that denotes a
            null effect (i.e. 0 for mean difference or other absolute scales and 1 for odds
            ratio/relative risk or other ratio/relative scales). Alternatively, the minimal
            clinically important difference could be used as the superiority margin, however, it
            will be more difficult to declare superiority under this design choice.
          </li>
        </ul>
      </HelpSection>

      <HelpSection title={FIELD_LABELS.superiorityThreshold}>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            The probability required for the superiority rule to be triggered. Common values include
            0.90, 0.95, 0.975, and 0.99. Increasing this cutoff makes it more difficult to declare
            superiority.
          </li>
        </ul>
      </HelpSection>

      <HelpSection title={FIELD_LABELS.futilityMargin}>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            The treatment difference used to define a lack of meaningful benefit. Trials may use a
            futility margin that represents a null effect (i.e. 0 for absolute scales and 1 for
            ratio scales). The minimal clinically important difference may also be used as the
            futility margin and would generally make it easier to declare futility.
          </li>
        </ul>
      </HelpSection>

      <HelpSection title={FIELD_LABELS.futilityThreshold}>
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            The probability required for the futility rule to be triggered. Common values include
            0.05, 0.10, and 0.20. Increasing this cutoff makes it easier to declare futility.
          </li>
        </ul>
      </HelpSection>

      <HelpSection title="MD">
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            Mean difference, referring to the difference between the treatment and control group for
            a continuous outcome.
          </li>
        </ul>
      </HelpSection>

      <HelpSection title="OR">
        <ul className="list-disc space-y-2 pl-5 leading-relaxed">
          <li>
            Odds ratio, referring to the difference between the treatment and control group for a
            binary outcome.
          </li>
        </ul>
      </HelpSection>
    </HelpPanel>
  )
}
