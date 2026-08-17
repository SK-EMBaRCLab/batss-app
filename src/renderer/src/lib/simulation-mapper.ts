import * as v from 'valibot'
import { designSchema, runnableDesignSchema } from './schema'
import type { SimulationRunInput } from '@shared/simulation-types'

export function toSimulationInput(design: v.InferOutput<typeof designSchema>): SimulationRunInput {
  return v.parse(runnableDesignSchema, design)
}
