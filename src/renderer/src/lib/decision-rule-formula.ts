import { effectDirection } from '@shared/effect-direction'
import type { DecisionRule, DesignInput } from '@shared/simulation-types'

import { treatmentEffects } from '@/lib/design-options'
import { defaultDecisionRule } from '@/lib/schema'

/** A rule as far as it's filled in: values are typed text in the form. */
export type FormulaRule = {
  type: DecisionRule['type']
  margin?: string | number
  threshold?: string | number
}

/** The parts of a design the formula depends on, typed text or numbers. */
export type FormulaDesign = {
  outcomeType?: DesignInput['outcomeType']
  treatmentEffectType?: DesignInput['treatmentEffectType']
  treatmentEffect?: string | number
  meanDiff?: string | number
}

/** MD for a continuous outcome, else the treatment effect's symbol (OR by default). */
function effectSymbol(design: FormulaDesign): string {
  if (design.outcomeType === 'continuous') return 'MD'
  return treatmentEffects.find(({ value }) => value === design.treatmentEffectType)?.symbol ?? 'OR'
}

/**
 * A rule as the probability it compares with its cutoff, e.g.
 * P(OR > 1) > 0.95 for superiority or P(MD < 0) < 0.05 for futility. The
 * inner comparison follows the direction of the treatment effect; a
 * missing margin or cutoff shows the rule's default for the outcome.
 */
export function decisionRuleFormula(rule: FormulaRule, design: FormulaDesign): string {
  const defaults = defaultDecisionRule(rule.type, design.outcomeType)
  const towards = effectDirection(design) === 'greater' ? '>' : '<'
  const comparison = rule.type === 'futility' ? '<' : '>'
  const margin = rule.margin ?? defaults.margin
  const threshold = rule.threshold ?? defaults.threshold

  return `P(${effectSymbol(design)} ${towards} ${margin}) ${comparison} ${threshold}`
}
