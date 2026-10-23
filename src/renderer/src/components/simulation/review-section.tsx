import { useField } from '@formisch/react'
import { DEFAULT_CORE_PERCENT, resolveCoreCount } from '@shared/cores'
import { ChevronDown, Clock, SlidersHorizontal } from 'lucide-react'
import { Fragment, type ReactElement, useEffect, useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { decisionRuleSummary, type DesignSnapshot, fieldsFor } from '@/lib/design-fields'
import { estimateSimulationDuration, formatEstimatedDurationRange } from '@/lib/duration-estimate'
import type { SimulationFormStore } from '@/types/form-types'

import { CoreUsageField } from './core-usage-field'

type ReviewItem = [label: string, value: string | number | undefined]

const descriptionListClassName = 'grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(12rem,auto)_1fr]'

function ReviewList({ items }: { items: ReviewItem[] }): ReactElement {
  return (
    <dl className={descriptionListClassName}>
      {items.map(([label, value]) => (
        <Fragment key={label}>
          <dt className="font-medium text-muted-foreground">{label}</dt>
          <dd>{value ?? '—'}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

export function ReviewSection({ form }: { form: SimulationFormStore }): ReactElement {
  const [performanceOpen, setPerformanceOpen] = useState(false)
  const outcomeType = useField(form, { path: ['outcomeType'] })
  const probability = useField(form, { path: ['probability'] })
  const treatmentEffectType = useField(form, { path: ['treatmentEffectType'] })
  const treatmentEffect = useField(form, { path: ['treatmentEffect'] })
  const meanOutcome = useField(form, { path: ['meanOutcome'] })
  const sd = useField(form, { path: ['sd'] })
  const meanDiff = useField(form, { path: ['meanDiff'] })
  const N = useField(form, { path: ['N'] })
  const m0 = useField(form, { path: ['m0'] })
  const m = useField(form, { path: ['m'] })
  const R = useField(form, { path: ['R'] })
  const corePercent = useField(form, { path: ['corePercent'] })
  const rules = useField(form, { path: ['decisionRules'] })

  const rule = rules.input[0]

  const [cpuCount, setCpuCount] = useState<number | null>(null)
  useEffect(() => {
    window.app.cpuCount().then(setCpuCount)
  }, [])

  const estimate = estimateSimulationDuration({
    N: N.input,
    m0: m0.input,
    m: m.input,
    R: R.input,
    corePercent: corePercent.input as number | undefined,
    cpuCount
  })

  const corePercentValue = (corePercent.input ?? DEFAULT_CORE_PERCENT) as number
  const resolvedCores = cpuCount
    ? resolveCoreCount(cpuCount, corePercentValue, Number(R.input) || undefined)
    : null

  const snapshot: DesignSnapshot = {
    outcomeType: outcomeType.input,
    probability: probability.input,
    treatmentEffectType: treatmentEffectType.input,
    treatmentEffect: treatmentEffect.input,
    meanOutcome: meanOutcome.input,
    sd: sd.input,
    meanDiff: meanDiff.input,
    N: N.input,
    m0: m0.input,
    m: m.input,
    R: R.input,
    decisionRules: rule ? [rule] : []
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold">Review Simulation Design</h3>

        {estimate && (
          <Tooltip>
            <TooltipTrigger
              render={
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  Estimated run time:{' '}
                  {formatEstimatedDurationRange(estimate.minSeconds, estimate.maxSeconds)}
                </p>
              }
            />
            <TooltipContent>
              A rough guide based on your settings; actual time depends on your computer.
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outcome Parameters</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ReviewList
            items={fieldsFor(outcomeType.input, 'outcome').map((field): ReviewItem => [
              field.label,
              field.value(snapshot)
            ])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample Size</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ReviewList
            items={[
              ...fieldsFor(outcomeType.input, 'sampleSize'),
              ...fieldsFor(outcomeType.input, 'simulation')
            ].map((field): ReviewItem => [field.label, field.value(snapshot)])}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decision Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-3 text-sm">
            <div className="font-medium">
              Rule 1: <span className="capitalize">{rule?.type}</span>
            </div>
            <div className="font-mono">{decisionRuleSummary(snapshot)}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Collapsible
          open={performanceOpen}
          onOpenChange={setPerformanceOpen}
          className="flex flex-col gap-(--card-spacing)"
        >
          <CollapsibleTrigger
            nativeButton={false}
            render={
              <CardHeader className="flex cursor-pointer flex-row items-center justify-between gap-4 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            }
          >
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                Performance Settings
              </CardTitle>
              <p className="pl-6 text-xs text-muted-foreground">
                Using {corePercentValue}% of CPU
                {resolvedCores !== null && ` (${resolvedCores} of ${cpuCount} cores)`}
              </p>
            </div>

            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${performanceOpen ? 'rotate-180' : ''}`}
            />
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent>
              <CoreUsageField form={form} />
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}
