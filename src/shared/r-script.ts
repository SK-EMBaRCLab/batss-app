// A run as an R script anyone can read and run with BATSS outside the
// app: its values written in, one batss.glm() call, and the summary
// printed. It builds the same call as resources/r/batss-simulation.R,
// which the app runs, so a change to one needs the same change here.
import { effectDirection } from './effect-direction'
import { outcomeModel } from './outcome-model'
import type { DecisionRule, SimulationResultEntry } from './simulation-types'

export type RScriptDetails = {
  designName: string
  appVersion: string
}

// For a comment line: anything that could end the comment (a line break)
// or show oddly (other control characters) becomes a space
function commentText(text: string): string {
  return text
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// A number as R reads it. The values were checked before the run, so
// anything else means a broken file rather than something to write out
function rNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error(`Not a number R can use: ${value}`)
  return String(value)
}

// The rule as the app shows it, e.g. P(OR > 1) > 0.95
function ruleFormula(rule: DecisionRule, symbol: string, towards: string): string {
  const comparison = rule.type === 'futility' ? '<' : '>'
  return `P(${symbol} ${towards} ${rule.margin}) ${comparison} ${rule.threshold}`
}

/** The run as a standalone R script. Throws for an outcome type that can't be run. */
export function runRScript(entry: SimulationResultEntry, details: RScriptDetails): string {
  const { input } = entry
  const model = outcomeModel(input.outcomeType)
  if (!model || input.outcomeType === 'ordinal') {
    throw new Error('Only binary and continuous outcomes can be exported.')
  }

  const binary = input.outcomeType === 'binary'
  const alternative = effectDirection(input)
  const symbol = binary ? 'OR' : 'MD'
  const towards = alternative === 'greater' ? '>' : '<'

  const superiority = input.decisionRules.find((rule) => rule.type === 'superiority')
  const futility = input.decisionRules.find((rule) => rule.type === 'futility')
  const anyRule = superiority ?? futility
  if (!anyRule) throw new Error('A run has a superiority rule, a futility rule, or both.')
  // Odds ratio margins are compared on the log scale, like beta[2]
  const delta = (margin: number): string => (binary ? `log(${rNumber(margin)})` : rNumber(margin))
  // A missing rule gets the other rule's margin, as the app does: BATSS
  // ignores it, and with both the same it takes its one-margin path
  const deltaEff = delta((superiority ?? anyRule).margin)
  const deltaFut = delta((futility ?? anyRule).margin)

  const header = [
    `# ${commentText(details.designName) || 'Design'}${entry.name ? ` – ${commentText(entry.name)}` : ''}`,
    `# Run of ${entry.createdAt}, exported from BATSS Studio ${commentText(details.appVersion)}`,
    ...(entry.result.status === 'success'
      ? [`# The app ran it with BATSS ${commentText(entry.result.package)}.`]
      : []),
    '#',
    "# BATSS sets each simulated trial's seed itself (1 to R), so with the",
    '# same BATSS version this gives the same results as the app.'
  ]

  const outcome = binary
    ? [
        '# Binary outcome, modelled by logistic regression',
        'logit <- function(p) log(p / (1 - p))',
        '',
        `probability <- ${rNumber(input.probability)}  # in the control group`,
        `odds_ratio <- ${rNumber(input.treatmentEffect)}  # target treatment effect`,
        '',
        '# Intercept and the group effect, on the log-odds scale',
        'beta <- c(logit(probability), log(odds_ratio))',
        'var_control <- list(y = list(size = 1))'
      ]
    : [
        '# Continuous outcome, modelled by linear regression',
        `mean_outcome <- ${rNumber(input.meanOutcome)}  # in the control group`,
        `mean_diff <- ${rNumber(input.meanDiff)}  # target treatment effect`,
        `sd <- ${rNumber(input.sd)}`,
        '',
        '# Intercept and the group effect',
        'beta <- c(mean_outcome, mean_diff)',
        'var_control <- list(y = list(sd = sd))'
      ]

  const rules = [
    superiority
      ? [
          `  # Superiority: stop if ${ruleFormula(superiority, symbol, towards)}`,
          '  eff.arm = eff.arm.simple,',
          `  eff.arm.control = list(b = ${rNumber(superiority.threshold)}),`
        ]
      : ['  # No superiority rule', '  eff.arm = NULL,', '  eff.arm.control = NULL,'],
    [`  delta.eff = ${deltaEff},`],
    futility
      ? [
          `  # Futility: stop if ${ruleFormula(futility, symbol, towards)}`,
          '  fut.arm = fut.arm.simple,',
          `  fut.arm.control = list(b = ${rNumber(futility.threshold)}),`
        ]
      : ['  # No futility rule', '  fut.arm = NULL,', '  fut.arm.control = NULL,'],
    [`  delta.fut = ${deltaFut},`]
  ].flat()

  return [
    ...header,
    '',
    '# Each worker uses one thread, as in the app: INLA and its maths',
    '# libraries otherwise start one per core in every worker',
    'Sys.setenv(MKL_NUM_THREADS = "1", OMP_NUM_THREADS = "1", OPENBLAS_NUM_THREADS = "1")',
    '',
    'library(BATSS)',
    'library(INLA)',
    'inla.setOption(num.threads = "1:1")',
    'cat("BATSS", as.character(packageVersion("BATSS")), "\\n")',
    '',
    ...outcome,
    '',
    'trials <- batss.glm(',
    '  model = y ~ group,',
    `  family = "${model.family}",`,
    `  link = "${model.link}",`,
    `  var = list(y = ${model.varY}, group = alloc.balanced),`,
    '  var.control = var_control,',
    '  prob0 = c(Control = 1, Experimental = 1),',
    `  alternative = "${alternative}",`,
    '  beta = beta,',
    '  which = 2,',
    ...rules,
    `  N = ${rNumber(input.N)},  # maximum sample size`,
    `  interim = list(recruited = list(m0 = ${rNumber(input.m0)}, m = ${rNumber(input.m)})),`,
    `  R = ${rNumber(input.R)},  # simulated trials`,
    '  extended = 1,',
    '  computation = "parallel",',
    '  # All cores but one',
    '  mc.cores = max(1, parallel::detectCores() - 1, na.rm = TRUE)',
    ')',
    '',
    '# print() so it shows with source() too, not only Rscript',
    'print(summary(trials))',
    ''
  ].join('\n')
}
