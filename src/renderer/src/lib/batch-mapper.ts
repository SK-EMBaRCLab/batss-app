import type { BatchCsvRow, BatchRowValidation } from '@shared/batch-types'
import { checkSimulationRunInput } from '@shared/simulation-input-schema'
import * as v from 'valibot'

import { designSchema } from './schema'

const cell = (value: string | undefined): string | undefined => value?.trim() || undefined

function formatIssues(issues: v.BaseIssue<unknown>[]): string[] {
  return issues.map((issue) => {
    const path = issue.path?.map((segment) => String(segment.key)).join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
}

export function buildBatchValidations(rows: BatchCsvRow[]): BatchRowValidation[] {
  return rows.map((row, rowIndex) => {
    const outcomeType = row.outcomeType?.trim()

    const decisionRules = [
      {
        type: cell(row.decisionRuleType),
        direction: cell(row.decisionRuleDirection),
        margin: cell(row.decisionRuleMargin),
        threshold: cell(row.decisionRuleThreshold)
      }
    ]

    const common = {
      N: cell(row.N),
      m0: cell(row.m0),
      m: cell(row.m),
      R: cell(row.R),
      decisionRules
    }

    let candidate: Record<string, unknown>

    if (outcomeType === 'binary') {
      candidate = {
        outcomeType,
        probability: cell(row.probability),
        treatmentEffectType: row.treatmentEffectType?.trim(),
        treatmentEffect: cell(row.treatmentEffect),
        ...common
      }
    } else if (outcomeType === 'continuous') {
      candidate = {
        outcomeType,
        meanOutcome: cell(row.meanOutcome),
        sd: cell(row.sd),
        meanDiff: cell(row.meanDiff),
        ...common
      }
    } else {
      return {
        rowIndex,
        status: 'invalid' as const,
        errors: [
          `Row ${rowIndex + 1}: "outcomeType" must be "binary" or "continuous", got "${row.outcomeType ?? ''}"`
        ]
      }
    }

    const result = v.safeParse(designSchema, candidate)

    if (!result.success) {
      return {
        rowIndex,
        status: 'invalid' as const,
        errors: formatIssues(result.issues).map((msg) => `Row ${rowIndex + 1}: ${msg}`)
      }
    }

    // Same check the main process applies, so a row marked valid will run
    const checked = checkSimulationRunInput(result.output)
    if (!checked.success) {
      return {
        rowIndex,
        status: 'invalid' as const,
        errors: [`Row ${rowIndex + 1}: ${checked.message}`]
      }
    }

    return { rowIndex, status: 'valid' as const, input: checked.input }
  })
}

export function buildTemplateCsv(): string {
  const headers = [
    'outcomeType',
    'N',
    'm0',
    'm',
    'R',
    'probability',
    'treatmentEffectType',
    'treatmentEffect',
    'meanOutcome',
    'sd',
    'meanDiff',
    'decisionRuleType',
    'decisionRuleDirection',
    'decisionRuleMargin',
    'decisionRuleThreshold'
  ]

  const binaryExample = [
    'binary',
    '216',
    '60',
    '12',
    '10',
    '0.3',
    'oddsRatio',
    '1.5',
    '',
    '',
    '',
    'superiority',
    'greater',
    '1',
    '0.95'
  ]

  const continuousExample = [
    'continuous',
    '216',
    '60',
    '12',
    '10',
    '',
    '',
    '',
    '10',
    '2.5',
    '3',
    'superiority',
    'greater',
    '0',
    '0.95'
  ]

  return [headers, binaryExample, continuousExample].map((row) => row.join(',')).join('\n')
}
