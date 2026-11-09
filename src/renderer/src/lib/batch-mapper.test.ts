import { describe, expect, test } from 'vitest'

import { buildBatchValidations, buildTemplateCsv } from './batch-mapper'

const ROW = {
  outcomeType: 'binary',
  N: '216',
  m0: '60',
  m: '12',
  R: '10',
  probability: '0.3',
  treatmentEffectType: 'oddsRatio',
  treatmentEffect: '1.5'
}

/** The template as the rows a parsed CSV gives (its cells have no commas). */
function templateRows(): Record<string, string>[] {
  const [header, ...lines] = buildTemplateCsv().split('\n')
  const columns = header.split(',')
  return lines.map((line) => {
    const cells = line.split(',')
    return Object.fromEntries(columns.map((column, index) => [column, cells[index]]))
  })
}

describe('buildTemplateCsv', () => {
  test('has a column for each rule field and none for the old single rule', () => {
    const header = buildTemplateCsv().split('\n')[0].split(',')
    expect(header).toEqual(
      expect.arrayContaining([
        'superiorityMargin',
        'superiorityCutoff',
        'futilityMargin',
        'futilityCutoff'
      ])
    )
    expect(header.some((column) => column.startsWith('decisionRule'))).toBe(false)
  })

  test('every example row is valid and runnable', () => {
    const validations = buildBatchValidations(templateRows())
    expect(validations.map((row) => row.status)).toEqual(['valid', 'valid', 'valid', 'valid'])
  })

  test('shows superiority only, futility only and both', () => {
    const types = buildBatchValidations(templateRows()).map((row) =>
      row.status === 'valid' ? row.input.decisionRules.map((rule) => rule.type) : []
    )
    expect(types).toEqual([
      ['superiority'],
      ['futility'],
      ['superiority', 'futility'],
      ['superiority', 'futility']
    ])
  })
})

describe('buildBatchValidations', () => {
  test('reads each rule from its own columns', () => {
    const [row] = buildBatchValidations([
      {
        ...ROW,
        superiorityMargin: '1',
        superiorityCutoff: '0.95',
        futilityMargin: '1.1',
        futilityCutoff: '0.1'
      }
    ])
    expect(row.status).toBe('valid')
    if (row.status === 'valid') {
      expect(row.input.decisionRules).toEqual([
        { type: 'superiority', margin: 1, threshold: 0.95 },
        { type: 'futility', margin: 1.1, threshold: 0.1 }
      ])
    }
  })

  test('leaves out a rule whose cells are both empty', () => {
    const [row] = buildBatchValidations([
      {
        ...ROW,
        superiorityMargin: ' ',
        superiorityCutoff: '',
        futilityMargin: '1',
        futilityCutoff: '0.05'
      }
    ])
    expect(row.status).toBe('valid')
    if (row.status === 'valid') expect(row.input.decisionRules).toHaveLength(1)
  })

  test('reports a rule filled in halfway', () => {
    const [row] = buildBatchValidations([{ ...ROW, futilityMargin: '1' }])
    expect(row).toEqual({
      rowIndex: 0,
      status: 'invalid',
      errors: ['Row 1: decisionRules.0.threshold: Futility cutoff must be a number.']
    })
  })

  test('needs at least one rule', () => {
    const [row] = buildBatchValidations([ROW])
    expect(row).toEqual({
      rowIndex: 0,
      status: 'invalid',
      errors: ['Row 1: decisionRules: Add at least one decision rule.']
    })
  })

  test('applies the same rule checks as the form', () => {
    const [row] = buildBatchValidations([
      {
        ...ROW,
        superiorityMargin: '1',
        superiorityCutoff: '0.95',
        futilityMargin: '1',
        futilityCutoff: '0.95'
      }
    ])
    expect(row.status).toBe('invalid')
    if (row.status === 'invalid') {
      expect(row.errors[0]).toContain(
        'Futility cutoff must be less than the superiority cutoff when both rules use the same margin.'
      )
    }
  })
})
