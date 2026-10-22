import { type ReactElement } from 'react'

// Shown beside the Review step in place of field help, so the user knows
// what Run Simulation will do before they click it.
export function ReviewHelp(): ReactElement {
  return (
    <div className=" px-4 pb-4 pt-3 text-sm text-foreground/80">
      <div className="space-y-5">
        <p className="leading-relaxed">
          When you click <span className="font-medium text-foreground">Run Simulation</span>:
        </p>

        <ol className="list-decimal space-y-3 pl-5 leading-relaxed">
          <li>
            BATSS runs on this computer, using the CPU share set in Performance Settings. The
            estimated run time is shown at the top of the review.
          </li>
          <li>Progress appears below the form as the run works through its stages.</li>
          <li>
            The form is read-only while it runs. You can still step back through it, use other
            pages, or click Cancel to stop.
          </li>
          <li>
            When it finishes, the run is added to this design&apos;s history and Results opens. If
            Albatross is in the background, you&apos;ll get a notification.
          </li>
        </ol>

        <div className="space-y-2">
          <h4 className="font-medium text-primary">Keep your results</h4>
          <p className="leading-relaxed">
            Runs are stored in the design file, so save the design afterwards to keep them. Runs
            that go past the timeout in Settings are stopped automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
