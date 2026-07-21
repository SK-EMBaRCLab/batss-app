import { JSX } from 'react'
import { Form, useForm } from '@formisch/react'
import type { SubmitHandler } from '@formisch/react'

import { Button } from '@/components/ui/button'

import type { BatssRunInput } from '@shared/batss-types'

import { StudyDesignSection } from '@/components/batss/study-design-section'
import { DecisionRuleSection } from '@/components/batss/decision-rule-section'
import { SimulationSettingsSection } from '@/components/batss/simulation-settings-section'
import { designSchema, initialDesignInput } from '@/lib/schema'

type BatssFormProps = {
  onRun: (input: BatssRunInput) => Promise<void>
  isRunning: boolean
  elapsedSeconds: number
}

export function BatssForm({ onRun, isRunning, elapsedSeconds }: BatssFormProps): JSX.Element {
  const form = useForm({
    schema: designSchema,
    validate: 'blur',
    revalidate: 'input',
    initialInput: initialDesignInput
  })

  const handleSubmit: SubmitHandler<typeof designSchema> = async (output) => {
    await onRun({
      primaryOutcome: output.primaryOutcome,
      probability: output.probability,
      logOdds: output.logOdds,
      deltaEff: output.decisionRule.deltaEff,
      b: output.decisionRule.b,
      N: output.N,
      m0: output.m0,
      m: output.m,
      R: output.R
    })
  }

  return (
    <Form of={form} onSubmit={handleSubmit} className="space-y-4">
      <StudyDesignSection form={form} />
      <DecisionRuleSection form={form} />
      <SimulationSettingsSection form={form} />

      <Button type="submit" disabled={isRunning}>
        {isRunning ? `Running… ${elapsedSeconds.toFixed(1)} s` : 'Run simulation'}
      </Button>
    </Form>
  )
}
