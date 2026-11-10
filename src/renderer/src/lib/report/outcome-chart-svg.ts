// The results bar chart drawn as an SVG for the Word report, from the
// run's numbers rather than a screenshot of the page: the page's chart
// follows the app's theme, so in dark mode it would be light text on a
// dark chart inside a white document. Same order, colours and reference
// lines as the results page (bar-chart.tsx).
import { SIMULATION_SCENARIOS } from '@shared/design-rules'
import type { SimulationChartRow, SimulationOutcome } from '@shared/simulation-types'

import { OUTCOME_PRINT_COLOURS } from '@/lib/outcome-colours'
import {
  hasSuperiorOutcome,
  POWER_TARGET,
  SCENARIO_LABELS,
  TYPE_I_ERROR_TARGET
} from '@/lib/results-labels'

export const CHART_WIDTH = 640
export const CHART_HEIGHT = 360

// Stacked from the bottom up, as on the results page
const STACK_ORDER = [
  'Experimental Superior',
  'Inconclusive',
  'Futility'
] as const satisfies readonly SimulationOutcome[]

const TEXT = '#081E24'
const MUTED = '#5F6B70'
const GRID = '#E3E6E8'
const TYPE_I_ERROR_COLOUR = '#D3451E'

const FONT = 'font-family="Arial, Helvetica, sans-serif"'

const PLOT = { left: 72, right: 168, top: 24, bottom: 92 }

const percent = (share: number): string => `${Math.round(share * 100)}%`

// Numbers kept short in the SVG text
const px = (value: number): string => String(Math.round(value * 10) / 10)

/** The run's outcome shares by scenario as a stacked bar chart, as SVG text. */
export function outcomeChartSvg(chart: readonly SimulationChartRow[]): string {
  const plotWidth = CHART_WIDTH - PLOT.left - PLOT.right
  const plotHeight = CHART_HEIGHT - PLOT.top - PLOT.bottom
  const y = (share: number): number => PLOT.top + plotHeight * (1 - share)

  const produced = STACK_ORDER.filter((outcome) => chart.some((row) => row.Outcome === outcome))
  const share = (scenario: string, outcome: SimulationOutcome): number =>
    chart.find((row) => row.Scenario === scenario && row.Outcome === outcome)?.Proportion ?? 0

  const parts: string[] = []

  // Grid lines and the axis's percentages
  for (const tick of [0, 0.25, 0.5, 0.75, 1]) {
    parts.push(
      `<line x1="${PLOT.left}" x2="${PLOT.left + plotWidth}" y1="${px(y(tick))}" y2="${px(y(tick))}" stroke="${GRID}"/>`,
      `<text x="${PLOT.left - 8}" y="${px(y(tick) + 4)}" text-anchor="end" font-size="12" fill="${MUTED}" ${FONT}>${percent(tick)}</text>`
    )
  }
  parts.push(
    `<text transform="translate(18 ${px(PLOT.top + plotHeight / 2)}) rotate(-90)" text-anchor="middle" font-size="12" fill="${MUTED}" ${FONT}>Proportion of Simulated Trials</text>`
  )

  // One stacked bar per scenario
  const slot = plotWidth / SIMULATION_SCENARIOS.length
  const barWidth = slot * 0.5
  SIMULATION_SCENARIOS.forEach((scenario, index) => {
    const x = PLOT.left + slot * index + (slot - barWidth) / 2
    let stacked = 0
    for (const outcome of STACK_ORDER) {
      const value = share(scenario, outcome)
      if (value <= 0) continue
      parts.push(
        `<rect data-outcome="${outcome}" x="${px(x)}" y="${px(y(stacked + value))}" width="${px(barWidth)}" height="${px(plotHeight * value)}" fill="${OUTCOME_PRINT_COLOURS[outcome]}"/>`
      )
      stacked += value
    }
    parts.push(
      `<text x="${px(x + barWidth / 2)}" y="${px(PLOT.top + plotHeight + 20)}" text-anchor="middle" font-size="12" fill="${TEXT}" ${FONT}>${SCENARIO_LABELS[scenario]}</text>`
    )
  })

  // The targets for the superior bar, only when trials could stop for it
  if (hasSuperiorOutcome(chart)) {
    const lines = [
      { at: TYPE_I_ERROR_TARGET, colour: TYPE_I_ERROR_COLOUR, label: 'Type I Error Target' },
      { at: POWER_TARGET, colour: TEXT, label: 'Power Target' }
    ]
    for (const { at, colour, label } of lines) {
      parts.push(
        `<line x1="${PLOT.left}" x2="${PLOT.left + plotWidth}" y1="${px(y(at))}" y2="${px(y(at))}" stroke="${colour}" stroke-width="2" stroke-dasharray="6 3"/>`,
        `<text x="${PLOT.left + plotWidth + 8}" y="${px(y(at) + 4)}" font-size="12" fill="${colour}" ${FONT}>${label} (${percent(at)})</text>`
      )
    }
  }

  // Legend under the chart, for the outcomes this run produced
  const legendY = CHART_HEIGHT - 28
  let legendX = PLOT.left
  for (const outcome of produced) {
    parts.push(
      `<rect x="${legendX}" y="${legendY - 10}" width="12" height="12" fill="${OUTCOME_PRINT_COLOURS[outcome]}"/>`,
      `<text x="${legendX + 18}" y="${legendY}" font-size="12" fill="${TEXT}" ${FONT}>${outcome}</text>`
    )
    legendX += 18 + outcome.length * 7 + 24
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CHART_WIDTH}" height="${CHART_HEIGHT}" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}">` +
    `<rect width="100%" height="100%" fill="#FFFFFF"/>` +
    parts.join('') +
    '</svg>'
  )
}

/**
 * The SVG drawn onto a canvas and saved as PNG bytes, at `scale` times
 * its size so it stays sharp when printed. Needs a browser (the renderer).
 */
export async function svgToPng(svg: string, scale = 2): Promise<Uint8Array> {
  // A data: URL, which the app's content security policy allows for
  // images (blob: URLs it doesn't)
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = CHART_WIDTH * scale
  canvas.height = CHART_HEIGHT * scale
  const context = canvas.getContext('2d')
  if (!context) throw new Error('The chart could not be drawn')
  context.scale(scale, scale)
  context.drawImage(image, 0, 0, CHART_WIDTH, CHART_HEIGHT)

  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!png) throw new Error('The chart could not be saved as an image')
  return new Uint8Array(await png.arrayBuffer())
}
