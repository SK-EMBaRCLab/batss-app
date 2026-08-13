import { useState, type ReactElement } from 'react'
import { Form, getDeepErrorEntries, submit, useForm, validate } from '@formisch/react'
import type { SubmitHandler } from '@formisch/react'
import * as v from 'valibot'

import type { DesignInput, SimulationRunInput } from '@shared/simulation-types'
import { DecisionRuleSection } from '@/components/simulation/decision-rule-section'
import { designSchema, initialDesignInput } from '@/lib/schema'
import { OutcomeTypeSection } from './outcome-type-section'
import { OutcomeParametersSection } from './outcome-parameters-section'
import { Stepper } from '../stepper'
import { Button } from '../ui/button'
import { SampleSizeSection } from './sample-size-section'
import { ReviewSection } from './review-section'
import { toSimulationInput } from '@/lib/simulation-mapper'
import { useDesign } from '@/stores/design'
import { Play } from 'lucide-react'

type SimulationFormProps = {
  onRun: (input: SimulationRunInput) => Promise<void>
  initialInput?: DesignInput
}

const steps = [
  {
    id: 'outcome',
    title: 'Outcome Type'
  },
  {
    id: 'parameters',
    title: 'Outcome Parameters'
  },
  {
    id: 'sample-size',
    title: 'Sample Size'
  },
  {
    id: 'rules',
    title: 'Decision Rules'
  },
  {
    id: 'review',
    title: 'Review'
  }
]

export function SimulationForm({ onRun, initialInput }: SimulationFormProps): ReactElement {
  const isRunning = useDesign((s) => s.isRunning)
  const [step, setStep] = useState(0)
  const form = useForm({
    schema: designSchema,
    validate: 'blur',
    revalidate: 'input',
    initialInput: initialInput ?? initialDesignInput
  })

  const validateStep = async (): Promise<boolean> => {
    await validate(form)

    const errors = getDeepErrorEntries(form)

    console.log(errors)

    const hasOutcomeTypeError = errors.some(
      (error) => error.path.length === 1 && error.path[0] === 'outcomeType'
    )

    const hasProbabilityError = errors.some(
      (error) => error.path.length === 1 && error.path[0] === 'probability'
    )

    const hasTreatmentEffectTypeError = errors.some(
      (error) => error.path.length === 1 && error.path[0] === 'treatmentEffectType'
    )

    const hasTreatmentEffectError = errors.some(
      (error) => error.path.length === 1 && error.path[0] === 'treatmentEffect'
    )

    const hasMaxSampleSizeError = errors.some(
      (error) => error.path.length === 1 && error.path[0] === 'N'
    )
    const hasBurnInError = errors.some((error) => error.path.length === 1 && error.path[0] === 'm0')
    const hasInterimSampleError = errors.some(
      (error) => error.path.length === 1 && error.path[0] === 'm'
    )

    const hasNumOfSimulationsError = errors.some(
      (error) => error.path.length === 1 && error.path[0] === 'R'
    )

    const hasDecisionRulesError = errors.some(
      (error) => error.path.length === 1 && error.path[0] === 'decisionRules'
    )

    switch (step) {
      case 0:
        return !hasOutcomeTypeError
      case 1:
        return !hasProbabilityError && !hasTreatmentEffectTypeError && !hasTreatmentEffectError
      case 2:
        return (
          !hasMaxSampleSizeError &&
          !hasBurnInError &&
          !hasInterimSampleError &&
          !hasNumOfSimulationsError
        )
      case 3:
        return !hasDecisionRulesError
      case 4:
        return true
      default:
        return false
    }
  }

  const handleSubmit: SubmitHandler<typeof designSchema> = async (output) => {
    try {
      const input = toSimulationInput(output)

      await onRun(input)
    } catch (error) {
      if (v.isValiError(error)) {
        console.error('Invalid simulation input:', error.issues)
        return
      }
      throw error
    }
  }

  const handleBack = (): void => {
    setStep((current) => Math.max(current - 1, 0))
  }

  const handlePrimaryAction = async (): Promise<void> => {
    const valid = await validateStep()
    console.log(valid)
    if (!valid) return
    if (step < steps.length - 1) {
      setStep((current) => current + 1)
      return
    }

    submit(form)
  }

  const renderStep = (): ReactElement | null => {
    switch (step) {
      case 0:
        return <OutcomeTypeSection form={form} />

      case 1:
        return <OutcomeParametersSection form={form} />

      case 2:
        return <SampleSizeSection form={form} />

      case 3:
        return <DecisionRuleSection form={form} />

      case 4:
        return <ReviewSection form={form} />

      default:
        return null
    }
  }

  const runButton = (): ReactElement => {
    if (isRunning) {
      return (
        <>
          <Play className="mr-2 h-5 w-5 transition-transform animate-pulse scale-110" /> Running
        </>
      )
    }
    return (
      <>
        <Play className="mr-2 h-5 w-5 transition-transform" /> Run Simulation
      </>
    )
  }

  return (
    <Form
      id="simulation-form"
      of={form}
      onSubmit={(e) => {
        handleSubmit(e)
      }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="shrink-0 pb-6">
        <Stepper steps={steps} currentStep={step} onStepClick={setStep} className="shrink-0 pb-4" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">{renderStep()}</div>

      <div className="flex justify-between border-t pt-4">
        <Button type="button" variant="outline" disabled={step === 0} onClick={handleBack}>
          Back
        </Button>

        <Button type="button" onClick={handlePrimaryAction} disabled={isRunning}>
          {step === steps.length - 1 ? runButton() : 'Next'}
        </Button>
      </div>
    </Form>
  )
}
