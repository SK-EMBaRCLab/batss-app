export type SimulationRunInput = {
  // 'A' = positive primary outcome -> alternative = "greater"
  // 'B' = negative primary outcome -> alternative = "less"
  primaryOutcome: 'A' | 'B'
  probability: number
  logOdds: number
  deltaEff: number
  b: number
  N: number
  m0: number
  m: number
  R: number
}

export interface SimulationSummaryRow {
  Outcome: 'B Superior' | 'Inconclusive'
  H0: number
  H1: number
}

export interface SimulationChartRow {
  Scenario: 'H0' | 'H1'
  Outcome: 'B Superior' | 'Inconclusive'
  Proportion: number
}

export type SimulationRunResult =
  | {
      status: 'success'
      package: string
      table: SimulationSummaryRow[]
      chart: SimulationChartRow[]
    }
  | {
      status: 'error'
      message: string
    }

/** A single simulation run recorded against a StudyDesign. */
export interface SimulationResultEntry {
  id: string
  createdAt: string
  result: SimulationRunResult
}

/**
 * A study design is the persistent unit of work: the design parameters
 * plus every result that has ever been produced by running them. A
 * design can accumulate many results (e.g. re-running with a different
 * R, or just re-checking variance) without losing prior runs.
 */
export interface StudyDesign {
  version: 1
  id: string
  name: string
  createdAt: string
  input: SimulationRunInput
  results: SimulationResultEntry[]
}
