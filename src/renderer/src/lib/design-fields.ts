import { FIELD_LABELS } from '@shared/field-labels'
import type { DecisionRule, DesignInput } from '@shared/simulation-types'

import { getTreatmentEffectLabel } from '@/lib/design-options'
import { decisionRuleFormula } from '@/lib/utils'

/**
 * A loosely-typed "whatever design values we currently have" bag. Two
 * very different callers feed this:
 *  - DesignParams passes an already-validated
 *    SimulationRunInput or saved DesignInput — real numbers, complete
 *    DecisionRule objects.
 *  - ReviewSection passes a live formisch form snapshot, where numeric
 *    fields are still raw strings until the schema coerces them, and a
 *    decision rule can be only partially filled in.
 * Field `value()` functions only ever read and forward these values
 * (never do arithmetic on them), so the looser types cost nothing.
 */
type LooseDecisionRule = {
  type?: DecisionRule['type']
  direction?: DecisionRule['direction']
  margin?: string | number
  threshold?: string | number
}

export type DesignSnapshot = {
  outcomeType?: DesignInput['outcomeType']
  probability?: string | number
  treatmentEffectType?: DesignInput['treatmentEffectType']
  treatmentEffect?: string | number
  meanOutcome?: string | number
  meanDiff?: string | number
  sd?: string | number
  N?: string | number
  m0?: string | number
  m?: string | number
  R?: string | number
  decisionRules?: LooseDecisionRule[]
}

type Section = 'outcome' | 'sampleSize' | 'simulation'

type DesignField = {
  key: keyof typeof FIELD_LABELS
  label: string
  section: Section
  outcome?: 'binary' | 'continuous'
  value: (input: DesignSnapshot) => string | number | undefined
}

export const designFields: DesignField[] = [
  {
    key: 'outcomeType',
    label: FIELD_LABELS.outcomeType,
    section: 'outcome',
    value: (input) => input.outcomeType
  },
  {
    key: 'probability',
    label: FIELD_LABELS.probability,
    section: 'outcome',
    outcome: 'binary',
    value: (input) => (input.outcomeType === 'binary' ? input.probability : undefined)
  },
  {
    key: 'treatmentEffectType',
    label: FIELD_LABELS.treatmentEffectType,
    section: 'outcome',
    outcome: 'binary',
    value: (input) =>
      input.outcomeType === 'binary'
        ? getTreatmentEffectLabel(input.treatmentEffectType)
        : undefined
  },
  {
    key: 'treatmentEffect',
    label: FIELD_LABELS.treatmentEffect,
    section: 'outcome',
    outcome: 'binary',
    value: (input) => (input.outcomeType === 'binary' ? input.treatmentEffect : undefined)
  },
  {
    key: 'meanOutcome',
    label: FIELD_LABELS.meanOutcome,
    section: 'outcome',
    outcome: 'continuous',
    value: (input) => (input.outcomeType === 'continuous' ? input.meanOutcome : undefined)
  },
  {
    key: 'sd',
    label: FIELD_LABELS.sd,
    section: 'outcome',
    outcome: 'continuous',
    value: (input) => (input.outcomeType === 'continuous' ? input.sd : undefined)
  },
  {
    key: 'meanDiff',
    label: FIELD_LABELS.meanDiff,
    section: 'outcome',
    outcome: 'continuous',
    value: (input) => (input.outcomeType === 'continuous' ? input.meanDiff : undefined)
  },
  { key: 'm0', label: FIELD_LABELS.m0, section: 'sampleSize', value: (i) => i.m0 },
  {
    key: 'm',
    label: FIELD_LABELS.m,
    section: 'sampleSize',
    value: (i) => i.m
  },
  {
    key: 'N',
    label: FIELD_LABELS.N,
    section: 'sampleSize',
    value: (i) => i.N
  },
  {
    key: 'R',
    label: FIELD_LABELS.R,
    section: 'simulation',
    value: (i) => i.R
  }
]

export function fieldsFor(
  outcomeType: DesignSnapshot['outcomeType'],
  section?: Section
): DesignField[] {
  return designFields.filter(
    (field) =>
      (!field.outcome || field.outcome === outcomeType) && (!section || field.section === section)
  )
}

export function decisionRuleSummary(input: DesignSnapshot): string {
  const rule = input.decisionRules?.[0]
  if (!rule) return ''

  if (input.outcomeType === 'binary') {
    return decisionRuleFormula({ ...rule, treatmentEffectType: input.treatmentEffectType })
  }

  if (input.outcomeType === 'continuous') {
    return decisionRuleFormula({ ...rule, treatmentEffectType: 'meanDifference' })
  }

  return ''
}
