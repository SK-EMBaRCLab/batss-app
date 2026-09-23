import type { DesignInput, SimulationRunInput } from '@shared/simulation-types'
import { type ReactElement } from 'react'

import { decisionRuleSummary, fieldsFor } from '@/lib/design-fields'

import { Separator } from '../ui/separator'

export function CompactDesignParams({
  input
}: {
  input: SimulationRunInput | DesignInput
}): ReactElement | null {
  if (input.outcomeType !== 'binary' && input.outcomeType !== 'continuous') {
    return null
  }

  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Group label="Outcome">
          {fieldsFor(input.outcomeType, 'outcome').map((field) => (
            <Item
              key={field.key}
              label={field.shortLabel ?? field.label}
              value={field.value(input)}
            />
          ))}
        </Group>

        <Separator orientation="vertical" className="hidden h-4 w-px sm:block" />

        <Group label="Simulation">
          {[
            ...fieldsFor(input.outcomeType, 'sampleSize'),
            ...fieldsFor(input.outcomeType, 'simulation')
          ].map((field) => (
            <Item
              key={field.key}
              label={field.shortLabel ?? field.label}
              value={field.value(input)}
            />
          ))}
        </Group>

        <Separator orientation="vertical" className="hidden h-4 w-px sm:block" />

        <Group label="Decision">
          <Item label="Rule" value={decisionRuleSummary(input)} />
        </Group>
      </div>
    </div>
  )
}

function Group({
  label,
  children
}: {
  label: string
  children: ReactElement | ReactElement[]
}): ReactElement {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-semibold text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function Item({
  label,
  value
}: {
  label: string
  value: string | number | undefined
}): ReactElement {
  return (
    <span className="whitespace-nowrap">
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="font-medium">{value ?? '—'}</span>
    </span>
  )
}
