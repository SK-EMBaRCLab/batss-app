import { JSX } from 'react'
import { Form, useForm } from '@formisch/react'
import type { SubmitHandler } from '@formisch/react'

import type { SimulationRunInput } from '@shared/simulation-types'

import { StudyDesignSection } from '@/components/simulation/study-design-section'
import { DecisionRuleSection } from '@/components/simulation/decision-rule-section'
import { SimulationSettingsSection } from '@/components/simulation/simulation-settings-section'
import { designSchema, initialDesignInput } from '@/lib/schema'

type BatssFormProps = {
  onRun: (input: SimulationRunInput) => Promise<void>
  initialInput?: SimulationRunInput
}

export function SimulationForm({ onRun, initialInput }: BatssFormProps): JSX.Element {
  const form = useForm({
    schema: designSchema,
    validate: 'blur',
    revalidate: 'input',
    initialInput: initialInput ?? initialDesignInput
  })

  const handleSubmit: SubmitHandler<typeof designSchema> = async (output) => {
    await onRun({
      primaryOutcome: output.primaryOutcome,
      probability: output.probability,
      logOdds: output.logOdds,
      deltaEff: output.deltaEff,
      b: output.b,
      N: output.N,
      m0: output.m0,
      m: output.m,
      R: output.R
    })
  }

  return (
    <Form
      id="simulation-form"
      of={form}
      onSubmit={handleSubmit}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <StudyDesignSection form={form} />
          <DecisionRuleSection form={form} />
          <SimulationSettingsSection form={form} />
        </div>
      </div>
    </Form>
  )
}
