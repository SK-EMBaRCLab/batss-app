import type { SubmitHandler } from '@formisch/react'
import { Form, getDeepErrorEntries, submit, useForm, validate } from '@formisch/react'
import type { DesignInput, SimulationRunInput } from '@shared/simulation-types'
import { Info, Play, Square } from 'lucide-react'
import { type ReactElement, useState } from 'react'
import * as v from 'valibot'

import { Stepper } from '@/components/common/stepper'
import { DecisionRuleSection } from '@/components/simulation/decision-rule-section'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { designSchema, initialDesignInput } from '@/lib/schema'
import { toSimulationInput } from '@/lib/simulation-mapper'
import { useEngine } from '@/stores/engine'
import { useSimulation } from '@/stores/simulation'
import { SimulationFormStore } from '@/types/form-types'

import { DecisionRuleHelp } from './decision-rule-help'
import { OutcomeParametersHelp } from './outcome-parameters-help'
import { OutcomeParametersSection } from './outcome-parameters-section'
import { OutcomeTypeHelp } from './outcome-type-help'
import { OutcomeTypeSection } from './outcome-type-section'
import { ReviewSection } from './review-section'
import { SampleSizeHelp } from './sample-size-help'
import { SampleSizeSection } from './sample-size-section'
import { hasAnyFieldError } from './utils'

type SimulationFormProps = {
  onRun: (input: SimulationRunInput, output: DesignInput) => Promise<void>
  initialInput?: DesignInput
}

type WizardStep = {
  id: string
  title: string
  fields: string[]
  render: (form: SimulationFormStore) => ReactElement
  help: (form: SimulationFormStore) => ReactElement | null
}

const steps: WizardStep[] = [
  {
    id: 'outcome',
    title: 'Outcome Type',
    fields: ['outcomeType'],
    render: (form) => <OutcomeTypeSection form={form} />,
    help: (form) => <OutcomeTypeHelp form={form} />
  },
  {
    id: 'parameters',
    title: 'Outcome Parameters',
    fields: [
      'probability',
      'treatmentEffectType',
      'treatmentEffect',
      'meanOutcome',
      'sd',
      'meanDiff'
    ],
    render: (form) => <OutcomeParametersSection form={form} />,
    help: (form) => <OutcomeParametersHelp form={form} />
  },
  {
    id: 'sample-size',
    title: 'Sample Size',
    fields: ['N', 'm0', 'm', 'R'],
    render: (form) => <SampleSizeSection form={form} />,
    help: () => <SampleSizeHelp />
  },
  {
    id: 'rules',
    title: 'Decision Rules',
    fields: ['decisionRules'],
    render: (form) => <DecisionRuleSection form={form} />,
    help: () => <DecisionRuleHelp />
  },
  {
    id: 'review',
    title: 'Review',
    fields: [],
    render: (form) => <ReviewSection form={form} />,
    help: () => null
  }
]

export function SimulationForm({ onRun, initialInput }: SimulationFormProps): ReactElement {
  const busy = useEngine((s) => s.busy)
  const cancel = useSimulation((s) => s.cancel)
  const isRunning = busy === 'simulation'
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

    return !hasAnyFieldError(errors, steps[step].fields)
  }

  const handleSubmit: SubmitHandler<typeof designSchema> = async (output) => {
    try {
      const input = toSimulationInput(output)

      await onRun(input, output)
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
    if (!valid) return
    if (step < steps.length - 1) {
      setStep((current) => current + 1)
      return
    }

    submit(form)
  }

  const runButton = (): ReactElement => {
    if (isRunning) {
      return (
        <Button variant="destructive" onClick={() => cancel()}>
          <Square className="mr-2 h-5 w-5 transition-transform animate-pulse scale-110" /> Cancel
        </Button>
      )
    }

    if (step === steps.length - 1) {
      return (
        <Button type="button" onClick={handlePrimaryAction}>
          <Play className="mr-2 h-5 w-5 transition-transform" /> Run Simulation
        </Button>
      )
    }

    return (
      <Button type="button" onClick={handlePrimaryAction}>
        Next
      </Button>
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
      <Separator className="h-px" />
      <div
        className={`grid min-h-0 flex-1 gap-6 transition-[grid-template-columns] duration-300 ${
          step === 4 ? 'lg:grid-cols-[minmax(0,1fr)_0fr]' : 'lg:grid-cols-[minmax(0,1fr)_22rem]'
        }`}
      >
        <div className="min-h-0 overflow-y-auto p-6">{steps[step].render(form)}</div>

        <aside
          className={`hidden min-h-0 min-w-0 border-l lg:block transition-opacity duration-300 ${
            step === 4 ? 'border-transparent opacity-0' : 'opacity-100'
          }`}
        >
          <ScrollArea className="h-full w-full">
            <div className="p-4">{steps[step].help(form)}</div>
          </ScrollArea>
        </aside>

        <div className={`lg:hidden ${step === 4 ? 'hidden' : ''}`}>
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="sm">
                  <Info /> Help
                </Button>
              }
            />
            <SheetContent side="right" className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>{steps[step].title}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1 px-6 pb-6">{steps[step].help(form)}</ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex justify-between border-t pt-4">
        <Button type="button" variant="outline" disabled={step === 0} onClick={handleBack}>
          Back
        </Button>

        {runButton()}
      </div>
    </Form>
  )
}
