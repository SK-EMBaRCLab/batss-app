type SimulationRunCommon = {
  N: number
  m0: number
  m: number
  R: number
  decisionRules: DecisionRule[]
}

type BinarySimulationRunInput = {
  outcomeType: 'binary'

  probability: number

  treatmentEffectType: 'oddsRatio' | 'riskDifference' | 'riskRatio'

  treatmentEffect: number
} & SimulationRunCommon

type ContinuousSimulationRunInput = {
  outcomeType: 'continuous'

  meanOutcome: number
  meanDiff: number
  sd: number
} & SimulationRunCommon

type OrdinalSimulationRunInput = {
  outcomeType: 'ordinal'

  // Add ordinal-specific fields here when you define them.
} & SimulationRunCommon

export type SimulationRunInput =
  BinarySimulationRunInput | ContinuousSimulationRunInput | OrdinalSimulationRunInput

export type DecisionRule = {
  type: 'superiority' | 'futility'
  direction: 'greater' | 'less'
  margin: number
  threshold: number
}

export interface SimulationSummaryRow {
  Outcome: 'Experimental Superior' | 'Inconclusive'
  'Null Effect': number
  'Target Effect': number
}

export interface SimulationChartRow {
  Scenario: 'Null Effect' | 'Target Effect'
  Outcome: 'Experimental Superior' | 'Inconclusive'
  Proportion: number
}

export type SimulationRunResult =
  | {
      status: 'success'
      package: string
      table: SimulationSummaryRow[]
      chart: SimulationChartRow[]
      sampleSize: SampleSizeData
    }
  | {
      status: 'error'
      message: string
    }

/** A single simulation run recorded against a StudyDesign. */
export interface SimulationResultEntry {
  id: string
  createdAt: string
  input: SimulationRunInput
  result: SimulationRunResult
}

export type DesignInput = {
  outcomeType: 'binary' | 'continuous' | 'ordinal' | undefined

  probability: number | undefined
  treatmentEffectType: 'oddsRatio' | 'riskDifference' | 'riskRatio' | undefined
  treatmentEffect: number | undefined

  meanOutcome: number | undefined
  meanDiff: number | undefined
  sd: number | undefined

  N: number
  m0: number
  m: number
  R: number
  decisionRules: DecisionRule[]
}

/**
 * A study design is the persistent unit of work: the design parameters
 * plus every result that has ever been produced by running them. A
 * design can accumulate many results (e.g. re-running with a different
 * R, or just re-checking variance) without losing prior runs.
 */
export interface StudyDesign {
  version: 2
  id: string
  name: string
  createdAt: string
  input: DesignInput
  results: SimulationResultEntry[]
}

export type SampleSizeScenario = {
  control: number[]
  experimental: number[]
}

export type SampleSizeData = {
  H0: SampleSizeScenario
  H1: SampleSizeScenario
}
