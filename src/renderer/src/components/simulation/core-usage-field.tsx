import { Field as FormischField, useField } from '@formisch/react'
import { DEFAULT_CORE_PERCENT, resolveCoreCount } from '@shared/cores'
import { CORE_PERCENTS } from '@shared/design-rules'
import { type ReactElement, useEffect, useId, useState } from 'react'

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { SimulationFormStore } from '@/types/form-types'

import { useFormLocked } from './form-locked'

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
  // The slider's name: Base UI passes the root's aria-labelledby on to the
  // thumb, the part that's focused (a label's htmlFor would point at the
  // root, which isn't)
  const labelId = useId()

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
                <Label id={labelId} className="text-sm font-medium">
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
              aria-labelledby={labelId}
              disabled={locked}
              value={percent}
              onValueChange={(value) => field.onChange(value as (typeof CORE_PERCENTS)[number])}
              min={CORE_PERCENTS[0]}
              max={CORE_PERCENTS[CORE_PERCENTS.length - 1]}
              // The allowed values are evenly spaced
              step={CORE_PERCENTS[1] - CORE_PERCENTS[0]}
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              {CORE_PERCENTS.map((step) => (
                <span key={step}>{step}%</span>
              ))}
            </div>
          </div>
        )
      }}
    </FormischField>
  )
}
