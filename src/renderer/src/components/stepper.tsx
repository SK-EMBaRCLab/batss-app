import { type ReactElement } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'
import { Check } from 'lucide-react'
import { Separator } from './ui/separator'
import { Progress } from './ui/progress'

type Step = {
  id: string
  title: string
  description?: string
}

type StepperProps = {
  steps: Step[]
  currentStep: number
  onStepClick?: (index: number) => void
  className?: string
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  className
}: StepperProps): ReactElement {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop */}
      <div className="hidden items-center justify-center py-2 lg:flex">
        {steps.map((step, index) => {
          const completed = index < currentStep
          const active = index === currentStep
          const clickable = index <= currentStep

          return (
            <div key={step.id} className="flex items-start">
              <Button
                type="button"
                variant="ghost"
                disabled={!clickable}
                onClick={() => onStepClick?.(index)}
                className={cn(
                  'group h-auto flex-col gap-0 p-0 hover:bg-transparent',
                  clickable && !active && 'hover:text-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors',
                    active &&
                      'border-primary bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                    completed &&
                      'border-primary bg-primary text-primary-foreground group-hover:bg-primary/90',
                    !active && !completed && 'border-muted text-muted-foreground',
                    clickable &&
                      !active &&
                      !completed &&
                      'group-hover:border-primary group-hover:bg-primary/5'
                  )}
                >
                  {completed ? <Check className="h-4 w-4" /> : index + 1}
                </div>

                <div
                  className={cn(
                    'mt-2 text-center text-xs',
                    active ? 'font-bold text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}

                  {step.description && (
                    <div className="mt-1 hidden text-xs text-muted-foreground lg:block">
                      {step.description}
                    </div>
                  )}
                </div>
              </Button>

              {index < steps.length - 1 && (
                <Separator
                  className={cn(
                    'mx-4 mt-4 h-px w-12',
                    index < currentStep ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile */}
      <div className="py-2 lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">{steps[currentStep].title}</span>

          <span className="text-xs text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>

        <Progress value={progress} className="h-1.5" />
      </div>
    </div>
  )
}
