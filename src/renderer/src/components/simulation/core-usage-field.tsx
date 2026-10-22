import { Field as FormischField, useField } from '@formisch/react'
import { DEFAULT_CORE_PERCENT, resolveCoreCount } from '@shared/cores'
import { type ReactElement, useEffect, useState } from 'react'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { SimulationFormStore } from '@/types/form-types'

import { useFormLocked } from './form-locked'

const CORE_PERCENT_STEPS = [25, 50, 75, 100] as const

/**
 * How many CPU cores BATSS will use to parallelise across simulated
 * trials (`mc.cores`), as a percentage of the machine's total cores.
 * Resolved to an actual worker count in the main process; this slider
 * only stores the percentage, plus a live preview of what it resolves
 * to on this machine using the same resolveCoreCount() (shared/cores.ts),
 * including the cap at R.
 */
export function CoreUsageField({ form }: { form: SimulationFormStore }): ReactElement {
  const locked = useFormLocked()
  const replicates = useField(form, { path: ['R'] })
  const [cpuCount, setCpuCount] = useState<number | null>(null)

  useEffect(() => {
    window.app.cpuCount().then(setCpuCount)
  }, [])

  return (
    <FormischField of={form} path={['corePercent']}>
      {(field) => {
        const percent = (field.input ?? DEFAULT_CORE_PERCENT) as number
        const resolvedCores = cpuCount
          ? resolveCoreCount(cpuCount, percent, Number(replicates.input) || undefined)
          : null

        return (
          <div className="max-w-md space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="slider-core-usage" className="text-sm font-medium">
                  CPU usage
                </Label>
                <p className="text-xs text-muted-foreground">
                  Share of this machine&apos;s cores used to run simulated trials in parallel.
                </p>
              </div>
              <span className="text-sm font-medium tabular-nums">
                {percent}%
                {resolvedCores !== null && (
                  <span className="ml-1 font-normal text-muted-foreground">
                    ({resolvedCores} of {cpuCount} cores)
                  </span>
                )}
              </span>
            </div>

            <Slider
              id="slider-core-usage"
              disabled={locked}
              value={percent}
              onValueChange={(value) =>
                field.onChange(value as (typeof CORE_PERCENT_STEPS)[number])
              }
              min={25}
              max={100}
              step={25}
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              {CORE_PERCENT_STEPS.map((step) => (
                <span key={step}>{step}%</span>
              ))}
            </div>
          </div>
        )
      }}
    </FormischField>
  )
}
