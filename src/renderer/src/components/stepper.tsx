import { type ReactElement } from 'react'
import { cn } from '@/lib/utils'

type Step = {
  id: string
  title: string
  description?: string
}

type StepperProps = {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps): ReactElement {
  return (
    <div className={cn('flex w-full items-center justify-between', className)}>
      {steps.map((step, index) => {
        const completed = index < currentStep
        const active = index === currentStep

        return (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors',

                  active && 'border-primary bg-primary text-primary-foreground',

                  completed && 'border-primary text-primary',

                  !active && !completed && 'border-muted text-muted-foreground'
                )}
              >
                {completed ? '✓' : index + 1}
              </div>

              <div
                className={cn(
                  'mt-2 text-center text-xs',

                  active ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.title}

                {step.description && (
                  <div className="mt-1 hidden text-xs text-muted-foreground sm:block">
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'mx-4 h-px flex-1',

                  index < currentStep ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
