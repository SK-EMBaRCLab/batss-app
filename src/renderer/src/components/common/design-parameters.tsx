import type { DesignInput, SimulationRunInput } from '@shared/simulation-types'
import { type ReactElement, type ReactNode } from 'react'

import { Separator } from '@/components/ui/separator'
import { decisionRuleSummary, fieldsFor } from '@/lib/design-fields'

export function DesignParams({
  input
}: {
  input: SimulationRunInput | DesignInput
}): ReactElement | null {
  if (input.outcomeType !== 'binary' && input.outcomeType !== 'continuous') {
    return null
  }

  return (
    <div className="space-y-6">
      <ParameterSection title="Outcome & Treatment Effect">
        {fieldsFor(input.outcomeType, 'outcome').map((field) => (
          <Parameter key={field.key} label={field.label} value={field.value(input)} />
        ))}
      </ParameterSection>

      <Separator className="h-px" />

      <ParameterSection title="Simulation Design">
        {fieldsFor(input.outcomeType, 'sampleSize').map((field) => (
          <Parameter key={field.key} label={field.label} value={field.value(input)} />
        ))}
      </ParameterSection>

      <Separator className="h-px" />

      <ParameterSection title="Decision & Simulation">
        <Parameter label="Decision Rule" value={decisionRuleSummary(input)} />
        {fieldsFor(input.outcomeType, 'simulation').map((field) => (
          <Parameter key={field.key} label={field.label} value={field.value(input)} />
        ))}
      </ParameterSection>
    </div>
  )
}

function ParameterSection({
  title,
  children
}: {
  title: string
  children: ReactNode
}): ReactElement {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-3">{children}</dl>
    </section>
  )
}

function Parameter({
  label,
  value
}: {
  label: string
  value: string | number | undefined
}): ReactElement {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
