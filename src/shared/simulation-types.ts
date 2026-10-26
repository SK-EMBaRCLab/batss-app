import type {
  CORE_PERCENTS,
  DECISION_RULE_TYPES,
  DIRECTIONS,
  OUTCOME_TYPES,
  TREATMENT_EFFECT_TYPES
} from './design-rules'

// The allowed values come from the lists in design-rules.ts, which the
// checks use too, so a new option is added in one place
export type OutcomeType = (typeof OUTCOME_TYPES)[number]
export type TreatmentEffectType = (typeof TREATMENT_EFFECT_TYPES)[number]
export type CorePercent = (typeof CORE_PERCENTS)[number]

type SimulationRunCommon = {
  N: number
  m0: number
  m: number
  R: number
  decisionRules: DecisionRule[]

  /**
   * Percentage of the machine's detected CPU cores to use for BATSS's
   * replicate-level parallelism (`mc.cores`). Resolved to an actual
   * core count in the main process (see simulation.service.ts), since
   * only Node knows `os.cpus().length` — R never needs to detect it
   * itself. Optional for backward compatibility with designs saved
   * before this setting existed.
   */
  corePercent?: CorePercent
}

type BinarySimulationRunInput = {
  outcomeType: 'binary'

  probability: number

  treatmentEffectType: TreatmentEffectType

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
  type: (typeof DECISION_RULE_TYPES)[number]
  direction: (typeof DIRECTIONS)[number]
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

export type SimulationRunResult = (
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
  | {
      status: 'cancelled'
      message: string
    }
) & {
  /**
   * Wall-clock time the run took, in milliseconds — set in
   * simulation.service.ts's execute() around the Rscript invocation.
   * Optional so results saved by older app versions (before this
   * field existed) still load.
   */
  durationMs?: number
}

/** A single simulation run recorded against a StudyDesign. */
export interface SimulationResultEntry {
  id: string
  createdAt: string
  input: SimulationRunInput
  result: SimulationRunResult
}

export type DesignInput = {
  outcomeType?: OutcomeType

  probability?: number
  treatmentEffectType?: TreatmentEffectType
  treatmentEffect?: number

  meanOutcome?: number
  meanDiff?: number
  sd?: number

  N: number
  m0: number
  m: number
  R: number
  decisionRules: DecisionRule[]

  corePercent?: CorePercent
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

/** What saving a design returns; filePath is where it was written. */
export type SaveResultResponse = { saved: boolean; filePath?: string }

export type SampleSizeScenario = {
  control: number[]
  experimental: number[]
}

export type SampleSizeData = {
  H0: SampleSizeScenario
  H1: SampleSizeScenario
}
