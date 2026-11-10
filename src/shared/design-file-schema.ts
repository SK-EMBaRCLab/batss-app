// Validates a StudyDesign loaded from a `.design` file on disk before
// it's trusted anywhere in the app. Files are plain JSON that users can
// hand-edit, move between app versions, or that can simply be
// corrupted — without this, a malformed file flows straight into
// renderer state and can crash the UI wherever it assumes a shape
// (e.g. `.map` on a missing array, `.toFixed` on a non-number).
//
// Deliberately permissive rather than a byte-for-byte mirror of the
// TypeScript types: unknown extra keys are ignored (forward
// compatibility with newer file versions) and `input` on each result
// entry is validated against the same shape as the design-level input
// rather than the stricter "runnable" variant, since both are valid
// shapes a well-formed file can contain.
import * as v from 'valibot'

import {
  CORE_PERCENTS,
  DECISION_RULE_TYPES,
  OUTCOME_TYPES,
  SIMULATION_OUTCOMES,
  TREATMENT_EFFECT_TYPES
} from './design-rules'
import type { SimulationRunResult, StudyDesign } from './simulation-types'

// Older files also store a direction. It's no longer used (the direction
// follows the sign of the treatment effect), so it isn't listed and
// v.object drops it on load.
const decisionRuleFileSchema = v.object({
  type: v.picklist(DECISION_RULE_TYPES),
  margin: v.number(),
  threshold: v.number()
})

const designInputFileSchema = v.object({
  outcomeType: v.optional(v.picklist(OUTCOME_TYPES)),

  probability: v.optional(v.number()),
  treatmentEffectType: v.optional(v.picklist(TREATMENT_EFFECT_TYPES)),
  treatmentEffect: v.optional(v.number()),

  meanOutcome: v.optional(v.number()),
  meanDiff: v.optional(v.number()),
  sd: v.optional(v.number()),

  N: v.number(),
  m0: v.number(),
  m: v.number(),
  R: v.number(),
  // Must be listed or v.object strips it, and every loaded design falls
  // back to the default CPU share. An unexpected value is dropped (so the
  // default applies) rather than rejecting the whole file.
  corePercent: v.fallback(v.optional(v.picklist(CORE_PERCENTS)), undefined),

  decisionRules: v.array(decisionRuleFileSchema)
})

const summaryRowFileSchema = v.object({
  Outcome: v.picklist(SIMULATION_OUTCOMES),
  'Null Effect': v.optional(v.number()),
  'Target Effect': v.optional(v.number())
})

const chartRowFileSchema = v.object({
  Scenario: v.union([v.literal('Null Effect'), v.literal('Target Effect')]),
  Outcome: v.picklist(SIMULATION_OUTCOMES),
  Proportion: v.number()
})

const sampleSizeScenarioFileSchema = v.object({
  control: v.array(v.number()),
  experimental: v.array(v.number())
})

const simulationRunResultFileSchema = v.union([
  v.object({
    status: v.literal('success'),
    package: v.string(),
    table: v.array(summaryRowFileSchema),
    chart: v.array(chartRowFileSchema),
    sampleSize: v.object({
      H0: sampleSizeScenarioFileSchema,
      H1: sampleSizeScenarioFileSchema
    }),
    durationMs: v.optional(v.number())
  }),
  v.object({
    status: v.literal('error'),
    message: v.string(),
    durationMs: v.optional(v.number())
  }),
  // Was missing until now — a saved design with a cancelled run would
  // fail to load at all, since nothing in the union matched it.
  v.object({
    status: v.literal('cancelled'),
    message: v.string(),
    durationMs: v.optional(v.number())
  })
])

/**
 * Checks a single run's result on its own, e.g. the JSON that
 * batss-simulation.R writes, rather than trusting it with a cast.
 * Returns null if it doesn't match.
 */
export function parseSimulationRunResult(data: unknown): SimulationRunResult | null {
  const result = v.safeParse(simulationRunResultFileSchema, data)
  // No cast: the schema's output is checked against SimulationRunResult
  const output: SimulationRunResult | null = result.success ? result.output : null
  return output
}

const simulationResultEntryFileSchema = v.object({
  id: v.string(),
  createdAt: v.string(),
  input: designInputFileSchema,
  result: simulationRunResultFileSchema
})

export const studyDesignFileSchema = v.object({
  version: v.literal(2),
  id: v.string(),
  name: v.string(),
  createdAt: v.string(),
  input: designInputFileSchema,
  results: v.array(simulationResultEntryFileSchema)
})

export type StudyDesignFileValidationResult =
  { success: true; data: StudyDesign } | { success: false; issues: string[] }

export function parseStudyDesignFile(data: unknown): StudyDesignFileValidationResult {
  const result = v.safeParse(studyDesignFileSchema, data)

  if (result.success) {
    // The one cast left, on purpose: each saved run's input is checked
    // with the looser design shape (see the note at the top), while
    // StudyDesign types it as a full SimulationRunInput. Everything else
    // in the schema matches StudyDesign.
    return { success: true, data: result.output as StudyDesign }
  }

  return {
    success: false,
    issues: result.issues.map((issue) => {
      const path = issue.path?.map((segment) => String(segment.key)).join('.')
      return path ? `${path}: ${issue.message}` : issue.message
    })
  }
}
