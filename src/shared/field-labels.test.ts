import { readdirSync, readFileSync } from 'fs'
import path from 'path'
import { describe, expect, test } from 'vitest'

import { FIELD_LABELS } from './field-labels'
import { checkSimulationRunInput } from './simulation-input-schema'

const SRC = path.join(__dirname, '..')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(file)
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [file] : []
  })
}

// The same words used for something other than the field, so they stay as
// they are: add to this list only with a reason
const NOT_FIELD_NAMES = [
  // Heading of the chart showing where the effect falls against the margin
  'renderer/src/components/simulation/decision-rule-preview.tsx: >Treatment effect<',
  // Title of the run stage that simulates the target effect (H1)
  "renderer/src/components/simulation/run-steps.tsx: 'Treatment effect'"
]

describe('FIELD_LABELS', () => {
  // A name typed out in quotes somewhere else would drift from the one here
  test('is the only place a field name is written', () => {
    const own = path.join(__dirname, 'field-labels.ts')
    const typedOut: string[] = []

    for (const file of sourceFiles(SRC)) {
      if (file === own) continue
      const text = readFileSync(file, 'utf8')
      for (const label of Object.values(FIELD_LABELS)) {
        for (const quoted of [`'${label}'`, `"${label}"`, `>${label}<`]) {
          const found = `${path.relative(SRC, file).split(path.sep).join('/')}: ${quoted}`
          if (text.includes(quoted) && !NOT_FIELD_NAMES.includes(found)) typedOut.push(found)
        }
      }
    }

    expect(typedOut, 'Use FIELD_LABELS from shared/field-labels.ts instead').toEqual([])
  })
})

describe('checkSimulationRunInput messages', () => {
  const valid = {
    outcomeType: 'continuous',
    meanOutcome: 10,
    sd: 2.5,
    meanDiff: 3,
    N: 216,
    m0: 60,
    m: 12,
    R: 10,
    decisionRules: [{ type: 'superiority', direction: 'greater', margin: 0, threshold: 0.95 }]
  }

  test('accepts a valid input', () => {
    expect(checkSimulationRunInput(valid).success).toBe(true)
  })

  test('names a field the same way the form does', () => {
    const checked = checkSimulationRunInput({ ...valid, sd: 0 })
    expect(checked.success).toBe(false)
    if (!checked.success) expect(checked.message).toContain(`${FIELD_LABELS.sd} must be`)
  })

  test('names both fields in a cross-field rule', () => {
    const checked = checkSimulationRunInput({ ...valid, m0: 216 })
    expect(checked.success).toBe(false)
    if (!checked.success) {
      expect(checked.message).toContain(FIELD_LABELS.m0)
      expect(checked.message).toContain(FIELD_LABELS.N.toLowerCase())
    }
  })
})
