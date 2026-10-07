import { useField } from '@formisch/react'
import { type ReactElement } from 'react'

import { SimulationFormStore } from '@/types/form-types'

export function OutcomeTypeHelp({ form }: { form: SimulationFormStore }): ReactElement {
  const outcomeType = useField(form, {
    path: ['outcomeType']
  })

  const selectedOutcomeType = outcomeType.input
  return (
    <div className=" px-4 pb-4 pt-3 text-sm text-foreground/80">
      <div className="space-y-3">
        <div
          className={`rounded-md border-l-2 p-3 transition-colors ${
            selectedOutcomeType === 'binary'
              ? 'border-l-secondary bg-secondary/5'
              : 'border-l-transparent'
          }`}
        >
          <h4 className="font-medium text-primary">Binary</h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>Each participant either experiences the event or does not</li>
            <li>Examples: treatment response, disease remission</li>
          </ul>
        </div>

        <div
          className={`rounded-md border-l-2 p-3 transition-colors ${
            selectedOutcomeType === 'continuous'
              ? 'border-l-secondary bg-secondary/5'
              : 'border-l-transparent'
          }`}
        >
          <h4 className="font-medium text-primary">Continuous</h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>Each participant has a numerical measurement</li>
            <li> Examples: blood pressure, cholesterol level</li>
          </ul>
        </div>

        <div
          className={`rounded-md border-l-2 p-3 transition-colors ${
            selectedOutcomeType === 'ordinal'
              ? 'border-l-secondary bg-secondary/5'
              : 'border-l-transparent'
          }`}
        >
          <h4 className="font-medium text-primary">
            Ordinal <span className="font-normal">(under development)</span>
          </h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>Each participant is scored with an ordered category</li>
            <li>Examples: WHO clinical progression scale, modified Rankin scale</li>
          </ul>
        </div>

        <div className={`rounded-md border-l-2 p-3 transition-colors border-l-transparent`}>
          <h4 className="font-medium text-primary">
            Count <span className="font-normal">(under development)</span>
          </h4>

          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>Each participant contributes a non-negative event count</li>
            <li>Examples: number of seizures or hospital visits</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
