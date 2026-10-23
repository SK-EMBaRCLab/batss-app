import type { SubmitHandler } from '@formisch/react'
import { Form, getDeepErrorEntries, submit, useForm, validate } from '@formisch/react'
import { checkSimulationRunInput } from '@shared/simulation-input-schema'
import type { DesignInput, SimulationRunInput } from '@shared/simulation-types'
import { Info, Play, Square } from 'lucide-react'
import { type ReactElement, type ReactNode, useState } from 'react'

import { Stepper } from '@/components/common/stepper'
import { DecisionRuleSection } from '@/components/simulation/decision-rule-section'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { toast } from '@/components/ui/toast'
import { useTallestHeight } from '@/hooks/use-tallest-height'
import { designSchema, initialDesignInput } from '@/lib/schema'
import { cn } from '@/lib/utils'
import { useEngine } from '@/stores/engine'
import { useSimulation } from '@/stores/simulation'
import { SimulationFormStore } from '@/types/form-types'

import { DecisionRuleHelp } from './decision-rule-help'
import { FormLockedContext } from './form-locked'
import { OutcomeParametersHelp } from './outcome-parameters-help'
import { OutcomeParametersSection } from './outcome-parameters-section'
import { OutcomeTypeHelp } from './outcome-type-help'
import { OutcomeTypeSection } from './outcome-type-section'
import { ReviewHelp } from './review-help'
import { ReviewSection } from './review-section'
import { SampleSizeHelp } from './sample-size-help'
import { SampleSizeSection } from './sample-size-section'
import { StepHelpCard } from './step-help-card'
import { hasAnyFieldError } from './utils'

type SimulationFormProps = {
  onRun: (input: SimulationRunInput, output: DesignInput) => Promise<void>
  initialInput?: DesignInput
  // Shown at the top of the form card (e.g. the design name)
  header?: ReactNode
}

type WizardStep = {
  id: string
  title: string
  // Heading for the help card, when it isn't about the step's fields
  helpTitle?: string
  fields: string[]
  render: (form: SimulationFormStore) => ReactElement
  help: (form: SimulationFormStore) => ReactElement
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
    helpTitle: 'What happens next',
    fields: [],
    render: (form) => <ReviewSection form={form} />,
    help: () => <ReviewHelp />
  }
]

export function SimulationForm({ onRun, initialInput, header }: SimulationFormProps): ReactElement {
  const busy = useEngine((s) => s.busy)
  const cancel = useSimulation((s) => s.cancel)
  const isRunning = busy === 'simulation'
  const [step, setStep] = useState(0)
  const stepHeights = useTallestHeight(steps.length)
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
    // The same check the main process applies before running, so anything
    // it would refuse is reported here instead
    const checked = checkSimulationRunInput(output)
    if (!checked.success) {
      toast.add({ type: 'error', title: "Can't run this simulation", description: checked.message })
      return
    }

    await onRun(checked.input, output)
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

  const { title, helpTitle = title } = steps[step]
  const help = steps[step].help(form)

  return (
    // Both cards size to their content rather than filling the page; once
    // a step is taller than the window, each flex level down to the step
    // body shrinks (min-h-0) and the step body scrolls.
    <div className="flex min-h-0 items-start gap-4">
      <Card className="flex max-h-full min-h-0 min-w-0 flex-1 flex-col">
        {header && <CardHeader className="shrink-0">{header}</CardHeader>}
        <CardContent className="flex min-h-0 flex-col">
          <Form
            id="simulation-form"
            of={form}
            onSubmit={(e) => {
              handleSubmit(e)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return

              // Nothing to advance or submit while a run is in progress. Leave
              // the default alone so Enter still activates a focused button
              // (e.g. Cancel); every input is disabled, so it can't submit.
              if (isRunning) return

              // Let Enter insert newlines in multi-line fields normally.
              if ((event.target as HTMLElement).tagName === 'TEXTAREA') return

              // Always route Enter through the same validate-then-advance
              // path as the Next/Run button, instead of letting the browser
              // decide whether to implicitly submit the native <form>.
              event.preventDefault()
              void handlePrimaryAction()
            }}
            className="flex min-h-0 flex-col"
          >
            <div className="shrink-0 pb-6">
              <Stepper
                steps={steps}
                currentStep={step}
                onStepClick={setStep}
                allowAnyStep={isRunning}
                className="shrink-0 pb-4"
              />
            </div>
            <Separator className="h-px" />
            <div
              className="min-h-0 overflow-y-auto"
              // As tall as the tallest step so the footer stays put, but
              // free to shrink (min-h-0) when the window is shorter; it
              // only scrolls if the current step doesn't fit
              style={{ height: stepHeights.tallest || undefined }}
            >
              {/* Read-only while running, so the form keeps matching the run in
                  progress. See form-locked.ts for the Base UI controls. */}
              <fieldset disabled={isRunning} className="min-w-0">
                <FormLockedContext value={isRunning}>
                  {/* Every step is rendered, so each one's natural height can
                      be measured (padding included) for the box above. Only
                      the current one takes up space; the rest collapse to
                      zero height, invisible and inert (no clicks, focus or
                      screen reader), so they never add to what scrolls. */}
                  <div className="grid">
                    {steps.map((wizardStep, index) => (
                      <div
                        key={wizardStep.id}
                        inert={index !== step}
                        className={cn(
                          'col-start-1 row-start-1 min-w-0',
                          index !== step && 'invisible h-0 overflow-hidden'
                        )}
                      >
                        <div ref={stepHeights.ref(index)} className="p-6">
                          {wizardStep.render(form)}
                        </div>
                      </div>
                    ))}
                  </div>
                </FormLockedContext>
              </fieldset>
            </div>

            <div className="shrink-0 pb-4 lg:hidden">
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
                    <SheetTitle>{helpTitle}</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="min-h-0 flex-1 px-6 pb-6">{help}</ScrollArea>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex shrink-0 justify-between border-t pt-4">
              <Button type="button" variant="outline" disabled={step === 0} onClick={handleBack}>
                Back
              </Button>

              {isRunning && (
                <p className="self-center text-xs text-muted-foreground">
                  Editing is paused while the simulation runs.
                </p>
              )}

              {runButton()}
            </div>
          </Form>
        </CardContent>
      </Card>

      <StepHelpCard title={helpTitle}>{help}</StepHelpCard>
    </div>
  )
}
