import { Check } from 'lucide-react'
import { type ReactElement } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { stepState } from './stepper-state'

type Step = {
  id: string
  title: string
}

type StepperProps = {
  steps: Step[]
  currentStep: number
  // The furthest step reached; it and every step before it can be clicked.
  // Defaults to the current step.
  reachedStep?: number
  onStepClick?: (index: number) => void
  // Lets every step be clicked, not just ones already reached (e.g.
  // while a run is in progress and the form is read-only)
  allowAnyStep?: boolean
  className?: string
}

// Dotted outline (rings can't be dotted) on hover marks a step as clickable
const CLICKABLE_HOVER =
  'group-hover:outline-2 group-hover:outline-offset-2 group-hover:outline-primary group-hover:outline-dotted'

export function Stepper({
  steps,
  currentStep,
  reachedStep = currentStep,
  onStepClick,
  allowAnyStep = false,
  className
}: StepperProps): ReactElement {
  return (
    // Sized by the form's own width (container queries), not the window's:
    // the help panel can leave the form far narrower than the screen
    <div className={cn('@container w-full', className)}>
      {/* Every step shares the width equally, so the steps never overlap
          and labels wrap instead of pushing into their neighbours. Below
          32rem (the narrowest is about 300px, with the sidebar and help
          panel both open) only the current step is labelled. */}
      <ol className="flex w-full items-start py-2">
        {steps.map((step, index) => {
          const { completed, active, clickable } = stepState(index, {
            currentStep,
            reachedStep,
            allowAnyStep
          })
          const last = index === steps.length - 1

          return (
            // Room below the circle for the current step's label when it's
            // positioned out of the flow (narrow widths)
            <li key={step.id} className="relative flex min-w-0 flex-1 justify-center pb-6 @lg:pb-0">
              {/* Connector to the next step, from just past this circle to
                  just before the next one (circles are 2rem, centred), so
                  it stretches with the gap and never crosses a circle */}
              {!last && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-4 right-[calc(-50%+1.5rem)] left-[calc(50%+1.5rem)] h-px',
                    index < reachedStep ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}

              <Button
                type="button"
                variant="ghost"
                disabled={!clickable}
                onClick={() => onStepClick?.(index)}
                // The label isn't shown for every step at narrow widths, so
                // the name is always the button's accessible name and tooltip
                aria-label={step.title}
                aria-current={active ? 'step' : undefined}
                title={step.title}
                // Unreachable steps are already shown muted, so not faded again
                className="group h-auto max-w-full flex-col gap-0 px-1 py-0 whitespace-normal hover:bg-transparent disabled:opacity-100"
              >
                {/* spans, not divs: only phrasing content is valid inside a button */}
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors',
                    active &&
                      'border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                    completed &&
                      'border-primary bg-primary text-primary-foreground group-hover:bg-primary/90',
                    !active && !completed && 'border-muted bg-background text-muted-foreground',
                    clickable &&
                      !active &&
                      !completed &&
                      'group-hover:border-primary group-hover:bg-primary/5',
                    clickable && !active && CLICKABLE_HOVER
                  )}
                >
                  {completed ? <Check className="h-4 w-4" /> : index + 1}
                </span>

                <span
                  className={cn(
                    'text-center text-xs text-balance @lg:mt-2 @lg:block',
                    active
                      ? // Narrow: out of the flow, on one line under the circle,
                        // over the neighbours' unlabelled space. Kept inside the
                        // stepper at either end.
                        cn(
                          'absolute top-10 font-bold whitespace-nowrap text-foreground',
                          '@lg:static @lg:translate-x-0 @lg:whitespace-normal',
                          index === 0 && 'left-0',
                          last && 'right-0',
                          index !== 0 && !last && 'left-1/2 -translate-x-1/2'
                        )
                      : 'hidden text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </Button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
