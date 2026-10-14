import { Check, CircleAlert, Loader2 } from 'lucide-react'
import { type ReactElement } from 'react'

import type { RunStage } from '@/lib/run-progress'
import { cn } from '@/lib/utils'

const STAGE_ORDER: RunStage[] = ['init', 'h1', 'h0', 'results']

const STAGE_TITLES: Record<RunStage, string> = {
  init: 'Setup',
  h1: 'Treatment effect',
  h0: 'No effect',
  results: 'Results'
}

type RunStepsProps = {
  stage: RunStage | null
  /** The run has finished, successfully or not. */
  done: boolean
  /** The run finished with an error/cancellation rather than success. */
  failed: boolean
}

/**
 * A plain-language, non-interactive stand-in for raw R/INLA log
 * output: BATSS works through 4 fixed stages (see run-progress.ts) —
 * this shows them as a simple step row instead, so a mid-run screen
 * full of statistical console output isn't the only thing a user sees.
 */
export function RunSteps({ stage, done, failed }: RunStepsProps): ReactElement {
  const activeIndex = stage ? STAGE_ORDER.indexOf(stage) : -1

  return (
    <div className="flex items-start">
      {STAGE_ORDER.map((id, index) => {
        const isPast = activeIndex > index
        const isCurrent = activeIndex === index
        const isCompleted = isPast || (isCurrent && done && !failed)
        const isFailed = isCurrent && done && failed
        const isActive = isCurrent && !done

        return (
          <div
            key={id}
            className={cn('flex items-center', index < STAGE_ORDER.length - 1 && 'flex-1')}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isActive && 'border-primary text-primary',
                  isFailed && 'border-destructive bg-destructive text-destructive-foreground',
                  !isCompleted && !isActive && !isFailed && 'border-muted text-muted-foreground'
                )}
              >
                {isCompleted && <Check className="h-3.5 w-3.5" />}
                {isActive && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isFailed && <CircleAlert className="h-3.5 w-3.5" />}
                {!isCompleted && !isActive && !isFailed && index + 1}
              </div>

              <span
                className={cn(
                  'text-[11px] whitespace-nowrap',
                  isActive || isCompleted || isFailed
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                {STAGE_TITLES[id]}
              </span>
            </div>

            {index < STAGE_ORDER.length - 1 && (
              <div className={cn('mx-2 h-px flex-1', isPast ? 'bg-primary' : 'bg-border')} />
            )}
          </div>
        )
      })}
    </div>
  )
}
