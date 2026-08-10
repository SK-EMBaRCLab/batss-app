import * as v from 'valibot'
import { runnableDesignSchema } from './schema'
import type { DesignInput, SimulationRunInput } from '@shared/simulation-types'

export function toSimulationInput(design: DesignInput): SimulationRunInput {
  const result = v.parse(runnableDesignSchema, design)

  return result
}
