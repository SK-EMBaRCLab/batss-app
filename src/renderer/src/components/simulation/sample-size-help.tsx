import { type ReactElement } from 'react'

export function SampleSizeHelp(): ReactElement {
  return (
    <div className=" px-4 pb-4 pt-3 text-sm text-foreground/80">
      <div className="space-y-5">
        <div className="space-y-2">
          <h4 className="font-medium text-primary">Burn-in sample size</h4>

          <p className="space-y-2 pl-5 leading-relaxed">
            The number of patients that must be enrolled before the trial may adapt based on
            accumulating data. Larger burn-in periods provide more initial data to inform adaptive
            decisions but delay adaptation.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">Patients between interim analyses</h4>

          <p className="space-y-2 pl-5 leading-relaxed">
            The number of patients enrolled analyses of the accumulating trial data. Smaller values
            allow the trial to response more quickly to new evidence but require more frequent
            analyses.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">Maximum sample size</h4>

          <p className="space-y-2 pl-5 leading-relaxed">
            The maximum number of participants that the trial can enroll. This may be determined
            based on funding constraints.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">Number of simulated trials</h4>

          <p className="space-y-2 pl-5 leading-relaxed">
            The number of trial simulations used to evaluate the operating characteristics of the
            design, At least 1,000 simulations are recommended for reliable estimates, but smaller
            values may be useful during model development or tuning to reduce computation time.
          </p>
        </div>
      </div>
    </div>
  )
}
