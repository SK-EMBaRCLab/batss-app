// Sample size statistics for a scenario, shared by the results page's
// table and the Word report so both show the same numbers.
import type { SampleSizeScenario } from '@shared/simulation-types'

export type SampleSizeStats = {
  mean: number
  quantile: number
  minimum: number
  maximum: number
}

export type ScenarioStats = {
  total: SampleSizeStats
  control: SampleSizeStats
  experimental: SampleSizeStats
}

export function calculateStats(values: number[], q: number): SampleSizeStats {
  if (values.length === 0) {
    return {
      mean: 0,
      quantile: 0,
      minimum: 0,
      maximum: 0
    }
  }

  const sorted = [...values].sort((a, b) => a - b)

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length

  const position = (sorted.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)

  const quantile =
    lower === upper
      ? sorted[lower]
      : sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)

  return {
    mean,
    quantile,
    minimum: sorted[0],
    maximum: sorted[sorted.length - 1]
  }
}

export function calculateScenarioStats(scenario: SampleSizeScenario, q: number): ScenarioStats {
  const total = scenario.control.map((value, index) => value + scenario.experimental[index])
  return {
    total: calculateStats(total, q),
    control: calculateStats(scenario.control, q),
    experimental: calculateStats(scenario.experimental, q)
  }
}
