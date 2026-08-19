import type { SimulationRunInput } from '@shared/simulation-types'
import * as v from 'valibot'

import { designSchema, runnableDesignSchema } from './schema'

export function toSimulationInput(design: v.InferOutput<typeof designSchema>): SimulationRunInput {
  return v.parse(runnableDesignSchema, design)
}
