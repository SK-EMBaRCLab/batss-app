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

import type { StudyDesign } from './simulation-types'

const decisionRuleFileSchema = v.object({
  type: v.picklist(['superiority', 'futility']),
  direction: v.picklist(['greater', 'less']),
  margin: v.number(),
  threshold: v.number()
})

const designInputFileSchema = v.object({
  outcomeType: v.optional(
    v.union([v.literal('binary'), v.literal('continuous'), v.literal('ordinal'), v.undefined()])
  ),

  probability: v.optional(v.number()),
  treatmentEffectType: v.optional(
    v.union([
      v.literal('oddsRatio'),
      v.literal('riskDifference'),
      v.literal('riskRatio'),
      v.undefined()
    ])
  ),
  treatmentEffect: v.optional(v.number()),

  meanOutcome: v.optional(v.number()),
  meanDiff: v.optional(v.number()),
  sd: v.optional(v.number()),

  N: v.number(),
  m0: v.number(),
  m: v.number(),
  R: v.number(),

  decisionRules: v.array(decisionRuleFileSchema)
})

const summaryRowFileSchema = v.object({
  Outcome: v.union([v.literal('Experimental Superior'), v.literal('Inconclusive')]),
  'Null Effect': v.optional(v.number()),
  'Target Effect': v.optional(v.number())
})

const chartRowFileSchema = v.object({
  Scenario: v.union([v.literal('Null Effect'), v.literal('Target Effect')]),
  Outcome: v.union([v.literal('Experimental Superior'), v.literal('Inconclusive')]),
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
    })
  }),
  v.object({
    status: v.literal('error'),
    message: v.string()
  })
])

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
    // Validated against the schema above, which mirrors StudyDesign.
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
