import { type ReactElement } from 'react'

export function DecisionRuleHelp(): ReactElement {
  return (
    <div className="border-t border-primary/10 px-4 pb-4 pt-3 text-sm text-foreground/80">
      <div className="space-y-5">
        <p className="leading-relaxed">
          Decision rules are predefined conditions that determine whether the trial adapts. When a
          rule is met, a pre-specified action takes place, such as stopping or modifying the trial.
        </p>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">Superiority</h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              A superiority rule tests whether one arm appears better than the other (or all
              others).
            </li>
            <li>
              In this two-arm design, meeting the superiority criterion will stop the trial early
              and declare the treatment arm superior to the control arm.
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">
            Futility <span className="font-normal">(under development)</span>
          </h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              A futility rule stops a study early if the probability of eventually demonstrating
              superiority is low.
            </li>
            <li>
              In this two-arm design, meeting the futility rule will stop the trial early,
              indicating that continuing the trial is unlikely to change the trial conclusion.
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">Direction</h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              Indicates whether a larger or smaller treatment effect is considered beneficial. Use{' '}
              <strong>Greater than (&gt;)</strong> when higher values are better and{' '}
              <strong>Less than (&lt;)</strong> when lower values are better.
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">Superiority margin</h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              The minimum treatment difference that is clinically meaningful (i.e., 0 or the minimal
              clinically important difference).
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">Decision threshold</h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              The probability required for a rule to be triggered. Common values include 0.90, 0.95,
              0.975, and 0.99.
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">MD</h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              Mean difference, referring to the difference between the treatment and control group
              for a continuous outcome.
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">OR</h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              Odds ratio, referring to the difference between the treatment and control group for a
              binary outcome.
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
