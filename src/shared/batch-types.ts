// src/shared/batch-types.ts
import type { SimulationRunInput, SimulationRunResult } from './simulation-types'

export type BatchCsvRow = Record<string, string>

export type BatchPreparedInput = {
  rowIndex: number
  input: SimulationRunInput
}

export type BatchRowValidation =
  | { rowIndex: number; status: 'valid'; input: SimulationRunInput }
  | { rowIndex: number; status: 'invalid'; errors: string[] }

export type BatchRunEntry = {
  rowIndex: number
  createdAt: string
  input: SimulationRunInput
  result: SimulationRunResult
}

export type BatchStatus = 'idle' | 'validating' | 'running' | 'done' | 'error' | 'cancelled'

export type BatchUpdate = {
  status: BatchStatus
  completed: number
  total: number
  message: string
}

// The columns the CSV is expected to have. outcomeType decides which of
// the binary/continuous columns get read for a given row — the other
// set can simply be left blank in that row.
export const BATCH_CSV_COLUMNS = [
  'outcomeType',
  'N',
  'm0',
  'm',
  'R',
  'probability',
  'treatmentEffectType',
  'treatmentEffect',
  'meanOutcome',
  'sd',
  'meanDiff',
  'decisionRuleType',
  'decisionRuleDirection',
  'decisionRuleMargin',
  'decisionRuleThreshold'
] as const
