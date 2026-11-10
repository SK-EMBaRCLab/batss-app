import type { BatchCsvRow, BatchRowValidation } from '@shared/batch-types'
import { checkSimulationRunInput } from '@shared/simulation-input-schema'
import * as v from 'valibot'

import { designSchema, initialDesignInput } from './schema'

const cell = (value: string | undefined): string | undefined => value?.trim() || undefined

function formatIssues(issues: v.BaseIssue<unknown>[]): string[] {
  return issues.map((issue) => {
    const path = issue.path?.map((segment) => String(segment.key)).join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
}

// Each rule's two columns. A rule with either cell filled in is part of
// the design, so one filled in halfway is reported rather than dropped;
// with both empty, the design has no rule of that type.
const RULE_COLUMNS = [
  { type: 'superiority', margin: 'superiorityMargin', threshold: 'superiorityCutoff' },
  { type: 'futility', margin: 'futilityMargin', threshold: 'futilityCutoff' }
] as const

function decisionRulesFrom(
  row: BatchCsvRow
): { type: string; margin: string | undefined; threshold: string | undefined }[] {
  return RULE_COLUMNS.flatMap(({ type, margin, threshold }) => {
    const rule = { type, margin: cell(row[margin]), threshold: cell(row[threshold]) }
    return rule.margin === undefined && rule.threshold === undefined ? [] : [rule]
  })
}

export function buildBatchValidations(rows: BatchCsvRow[]): BatchRowValidation[] {
  return rows.map((row, rowIndex) => {
    const outcomeType = row.outcomeType?.trim()

    const decisionRules = decisionRulesFrom(row)

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

const TEMPLATE_HEADERS = [
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
  ...RULE_COLUMNS.flatMap(({ margin, threshold }) => [margin, threshold])
] as const

type TemplateRow = Partial<Record<(typeof TEMPLATE_HEADERS)[number], string>>

// The same sample sizes a new design starts with
const SAMPLE_SIZE = {
  N: String(initialDesignInput.N),
  m0: String(initialDesignInput.m0),
  m: String(initialDesignInput.m),
  R: String(initialDesignInput.R)
}
const BINARY = { outcomeType: 'binary', probability: '0.3', treatmentEffectType: 'oddsRatio' }
const SUPERIORITY_OR = { superiorityMargin: '1', superiorityCutoff: '0.95' }
const FUTILITY_OR = { futilityMargin: '1', futilityCutoff: '0.05' }

// A superiority rule, a futility rule, or one of each; leave both of a
// rule's cells empty to leave it out
const TEMPLATE_ROWS: TemplateRow[] = [
  { ...BINARY, ...SAMPLE_SIZE, treatmentEffect: '1.5', ...SUPERIORITY_OR },
  { ...BINARY, ...SAMPLE_SIZE, treatmentEffect: '1.5', ...FUTILITY_OR },
  { ...BINARY, ...SAMPLE_SIZE, treatmentEffect: '1.5', ...SUPERIORITY_OR, ...FUTILITY_OR },
  {
    outcomeType: 'continuous',
    ...SAMPLE_SIZE,
    meanOutcome: '10',
    sd: '2.5',
    meanDiff: '3',
    superiorityMargin: '0',
    superiorityCutoff: '0.95',
    futilityMargin: '0',
    futilityCutoff: '0.05'
  }
]

export function buildTemplateCsv(): string {
  return [
    TEMPLATE_HEADERS.join(','),
    ...TEMPLATE_ROWS.map((row) => TEMPLATE_HEADERS.map((header) => row[header] ?? '').join(','))
  ].join('\n')
}
