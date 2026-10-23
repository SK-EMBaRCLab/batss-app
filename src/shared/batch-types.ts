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
  // Set on the update sent just before a row starts running
  startingRow?: boolean
}
