// What each design field is called wherever users see it: the form, its
// help panel, the review step, the dashboard, the results table tooltips
// and every validation message (in the form and in the main process). Edit
// a name here and it changes everywhere; don't type one out elsewhere.
export const FIELD_LABELS = {
  outcomeType: 'Outcome type',

  probability: 'Control arm event probability',
  treatmentEffectType: 'Treatment effect',
  treatmentEffect: 'Treatment effect value',

  meanOutcome: 'Mean outcome in the control arm',
  sd: 'Standard deviation of the outcome',
  meanDiff: 'Mean difference for the treatment effect',

  m0: 'Burn-in sample size',
  m: 'Patients between interim analyses',
  N: 'Maximum sample size',
  R: 'Number of simulated trials',

  decisionRuleType: 'Decision rule type',
  direction: 'Direction',
  margin: 'Superiority margin',
  threshold: 'Decision threshold'
} as const

export type LabelledField = keyof typeof FIELD_LABELS

// Shorter names for the results table's column headers, so it fits
// narrower windows (each header's tooltip shows the full name)
export const SHORT_FIELD_LABELS = {
  outcomeType: 'Outcome Type',
  treatmentEffectType: 'Effect Type',
  treatmentEffect: 'Effect Value',
  meanOutcome: 'Control Mean',
  sd: 'SD',
  meanDiff: 'Mean Difference',
  m0: 'Burn-in',
  m: 'Patients Between',
  N: 'Max Sample Size',
  R: 'Simulated Trials'
} as const satisfies Partial<Record<LabelledField, string>>
