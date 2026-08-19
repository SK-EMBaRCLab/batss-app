import { DesignInput, SimulationRunInput } from '@shared/simulation-types'
import { type ReactNode, type ReactElement } from 'react'

import { decisionRuleFormula } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

export function DesignParams({
  input
}: {
  input: SimulationRunInput | DesignInput
}): ReactElement | null {
  const rule = input?.decisionRules[0]
  let formula = ''
  if (input?.outcomeType === 'binary') {
    formula = decisionRuleFormula({
      ...rule,
      treatmentEffectType: input?.treatmentEffectType
    })
  } else if (input?.outcomeType === 'continuous') {
    formula = decisionRuleFormula({
      ...rule,
      treatmentEffectType: 'meanDifference'
    })
  }
  if (input?.outcomeType === 'binary') {
    return (
      <div className="space-y-6">
        <ParameterSection title="Outcome & Treatment Effect">
          <Parameter label="Outcome Type" value={input.outcomeType} />
          <Parameter label="Probability of outcome in control arm" value={input.probability} />
          <Parameter label="Odds Ratio" value={input.treatmentEffect} />
        </ParameterSection>
        <Separator className="h-0.5" />

        <ParameterSection title="Simulation Design">
          <Parameter label="Burn-in (m0)" value={input.m0} />
          <Parameter label="Patients between interims" value={input.m} />
          <Parameter label="Maximum sample size" value={input.N} />
        </ParameterSection>

        <Separator className="h-0.5" />

        <ParameterSection title="Decision & Simulation">
          <Parameter label="Decision Rule" value={formula} />
          <Parameter label="Number of simulations" value={input.R} />
        </ParameterSection>
      </div>
    )
  } else if (input?.outcomeType === 'continuous') {
    return (
      <div className="space-y-6">
        <ParameterSection title="Outcome & Treatment Effect">
          <Parameter label="Outcome Type" value={input.outcomeType} />
          <Parameter label="Mean outcome in control arm" value={input.meanOutcome} />
          <Parameter label="Standard Deviation" value={input.sd} />
          <Parameter label="Mean Difference for the treatment effect" value={input.meanDiff} />
        </ParameterSection>
        <Separator className="h-0.5" />
        <ParameterSection title="Simulation Design">
          <Parameter label="Burn-in (m0)" value={input.m0} />
          <Parameter label="Patients between interims" value={input.m} />
          <Parameter label="Maximum sample size" value={input.N} />
        </ParameterSection>
        <Separator className="h-0.5" />
        <ParameterSection title="Decision & Simulation">
          <Parameter label="Decision Rule" value={formula} />
          <Parameter label="Number of simulations" value={input.R} />
        </ParameterSection>
      </div>
    )
  }

  return null
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
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
