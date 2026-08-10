export type SimulationRunInput = {
  outcomeType: 'binary' | 'continuous' | 'ordinal'

  probability: number

  treatmentEffectType: 'oddsRatio' | 'riskDifference' | 'riskRatio'

  treatmentEffect: number

  N: number
  m0: number
  m: number
  R: number

  decisionRules: DecisionRule[]
}

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
  outcomeType?: 'binary' | 'continuous' | 'ordinal'
  probability?: number
  treatmentEffectType?: 'oddsRatio' | 'riskDifference' | 'riskRatio'
  treatmentEffect?: number

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
