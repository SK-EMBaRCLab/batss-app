// A run as a Word document people can edit: real headings, real tables,
// the chart as a picture, and the run's R script as an appendix. Built
// from the run's saved data only, with no DOM, so it can be tested; the
// chart's PNG is drawn by the caller (see export-run-report.ts).
import { SIMULATION_OUTCOMES, SIMULATION_SCENARIOS } from '@shared/design-rules'
import { runRScript } from '@shared/r-script'
import type { SimulationResultEntry } from '@shared/simulation-types'
import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx'

import { decisionRuleSummaries, fieldsFor } from '@/lib/design-fields'
import { SCENARIO_LABELS } from '@/lib/results-labels'
import { formatRunDate, formatRunDuration } from '@/lib/run-format'
import { runStatusLabel } from '@/lib/run-status'
import { calculateScenarioStats } from '@/lib/sample-size-stats'

import { CHART_HEIGHT, CHART_WIDTH } from './outcome-chart-svg'

export type RunReportDetails = {
  designName: string
  // What the design is for, if it has a description
  designDescription?: string
  appVersion: string
  // When the report was made, an ISO date
  generatedAt: string
  // The outcome chart as PNG bytes, for a successful run
  chartPng?: Uint8Array
}

// US Letter, 8.5 × 11 inches with 1 inch margins, in twentieths of a point
const TWIPS_PER_INCH = 1440
const LETTER = { width: 8.5 * TWIPS_PER_INCH, height: 11 * TWIPS_PER_INCH }
const MARGIN = TWIPS_PER_INCH

// The chart fills the text width: 6.5 inches at 96 pixels to the inch
const CHART_IMAGE_WIDTH = 6.5 * 96
const CHART_IMAGE_HEIGHT = (CHART_IMAGE_WIDTH * CHART_HEIGHT) / CHART_WIDTH

const HEADER_SHADING = { type: ShadingType.CLEAR, color: 'auto', fill: 'E7E9EA' }

// Control characters aren't allowed in a Word file's XML, and a line
// break only belongs where the text is split into paragraphs
const plain = (text: string): string =>
  text
    .replace(/\p{Cc}+/gu, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()

const display = (value: string | number | undefined): string =>
  value === undefined || value === '' ? '—' : plain(String(value))

const heading = (
  text: string,
  level: (typeof HeadingLevel)[keyof typeof HeadingLevel]
): Paragraph => new Paragraph({ heading: level, children: [new TextRun(text)] })

const paragraph = (text: string): Paragraph => new Paragraph({ children: [new TextRun(text)] })

// Each line of a longer text (the notes) as its own paragraph
const paragraphs = (text: string): Paragraph[] =>
  text.split(/\r?\n/).map(plain).filter(Boolean).map(paragraph)

/** A table with a shaded header row; numbers right-aligned from `numbersFrom`. */
function table(header: string[], rows: string[][], numbersFrom = header.length): Table {
  const cell = (text: string, column: number, isHeader: boolean): TableCell =>
    new TableCell({
      shading: isHeader ? HEADER_SHADING : undefined,
      children: [
        new Paragraph({
          alignment: column >= numbersFrom ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [new TextRun({ text, bold: isHeader })]
        })
      ]
    })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: header.map((text, column) => cell(text, column, true))
      }),
      ...rows.map(
        (row) => new TableRow({ children: row.map((text, column) => cell(text, column, false)) })
      )
    ]
  })
}

function titleBlock(entry: SimulationResultEntry, details: RunReportDetails): Paragraph[] {
  const createdAt = formatRunDate(entry.createdAt)
  const duration = formatRunDuration(entry.result.durationMs)
  const versions = [
    `BATSS Studio ${plain(details.appVersion)}`,
    entry.result.status === 'success' && `BATSS ${plain(entry.result.package)}`
  ]

  return [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(plain(details.designName) || 'Design')]
    }),
    ...paragraphs(details.designDescription ?? ''),
    ...(entry.name ? [heading(plain(entry.name), HeadingLevel.HEADING_2)] : []),
    paragraph(
      [`Run of ${createdAt}`, runStatusLabel(entry.result.status), duration]
        .filter(Boolean)
        .join(' · ')
    ),
    paragraph(versions.filter(Boolean).join(' · '))
  ]
}

function designSection(entry: SimulationResultEntry): (Paragraph | Table)[] {
  const { input } = entry
  if (input.outcomeType !== 'binary' && input.outcomeType !== 'continuous') return []

  const fieldRows = (section: 'outcome' | 'sampleSize' | 'simulation'): string[][] =>
    fieldsFor(input.outcomeType, section).map((field) => [field.label, display(field.value(input))])

  return [
    heading('Design parameters', HeadingLevel.HEADING_1),
    heading('Outcome & treatment effect', HeadingLevel.HEADING_2),
    table(['Parameter', 'Value'], fieldRows('outcome')),
    heading('Simulation design', HeadingLevel.HEADING_2),
    table(['Parameter', 'Value'], fieldRows('sampleSize')),
    heading('Decision & simulation', HeadingLevel.HEADING_2),
    table(
      ['Parameter', 'Value'],
      [
        ...decisionRuleSummaries(input).map((rule) => [rule.title, rule.formula]),
        ...fieldRows('simulation')
      ]
    )
  ]
}

function resultsSections(
  entry: SimulationResultEntry,
  chartPng: Uint8Array | undefined
): (Paragraph | Table)[] {
  const { result } = entry
  if (result.status !== 'success') {
    return [
      heading('Result', HeadingLevel.HEADING_1),
      paragraph(
        `This run ${result.status === 'cancelled' ? 'was cancelled' : 'failed'}, so it has no results.`
      ),
      ...paragraphs(result.message)
    ]
  }

  // Superior, futility, inconclusive, as in the results page's table
  const outcomeRows = [...result.table]
    .sort((a, b) => SIMULATION_OUTCOMES.indexOf(a.Outcome) - SIMULATION_OUTCOMES.indexOf(b.Outcome))
    .map((row) => [
      row.Outcome,
      ...SIMULATION_SCENARIOS.map((scenario) => (row[scenario] ?? 0).toFixed(3))
    ])

  const chart = chartPng
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: 'png',
              data: chartPng,
              transformation: { width: CHART_IMAGE_WIDTH, height: CHART_IMAGE_HEIGHT },
              altText: {
                name: 'Outcome chart',
                title: 'Outcome probabilities by scenario',
                description:
                  'Stacked bars of the share of simulated trials ending in each outcome, by scenario.'
              }
            })
          ]
        })
      ]
    : []

  const sampleSizeTables = SIMULATION_SCENARIOS.flatMap((scenario) => {
    const data = scenario === 'Null Effect' ? result.sampleSize.H0 : result.sampleSize.H1
    const median = calculateScenarioStats(data, 0.5)
    const p90 = calculateScenarioStats(data, 0.9)
    const groups = [
      ['Total', 'total'],
      ['Control', 'control'],
      ['Experimental', 'experimental']
    ] as const

    return [
      heading(SCENARIO_LABELS[scenario], HeadingLevel.HEADING_2),
      table(
        ['', 'Mean', 'Median', '90th percentile', 'Minimum', 'Maximum'],
        groups.map(([label, key]) => [
          label,
          median[key].mean.toFixed(0),
          median[key].quantile.toFixed(0),
          p90[key].quantile.toFixed(0),
          median[key].minimum.toFixed(0),
          median[key].maximum.toFixed(0)
        ]),
        1
      )
    ]
  })

  return [
    heading('Outcome probabilities', HeadingLevel.HEADING_1),
    paragraph('The share of simulated trials ending in each outcome, under each scenario.'),
    table(
      ['Trial outcome', ...SIMULATION_SCENARIOS.map((scenario) => SCENARIO_LABELS[scenario])],
      outcomeRows,
      1
    ),
    ...chart,
    heading('Sample sizes', HeadingLevel.HEADING_1),
    paragraph(
      'The number of patients the simulated trials enrolled, in total and in each group, under each scenario.'
    ),
    ...sampleSizeTables
  ]
}

function aboutSection(details: RunReportDetails): Paragraph[] {
  return [
    heading('About this report', HeadingLevel.HEADING_1),
    paragraph(
      `Generated by BATSS Studio ${plain(details.appVersion)}: ${formatRunDate(details.generatedAt)}`
    ),
    paragraph(
      "BATSS sets each simulated trial's random seed itself (1 to the number of simulated trials), " +
        'so running this design again with the same BATSS version gives the same results.'
    )
  ]
}

// The R script, line by line in a fixed-width font. Left out for an
// outcome type that can't be run (there's no script for it)
function appendix(entry: SimulationResultEntry, details: RunReportDetails): Paragraph[] {
  let script: string
  try {
    script = runRScript(entry, details)
  } catch {
    return []
  }

  return [
    new Paragraph({ children: [new PageBreak()] }),
    heading('Appendix: R script', HeadingLevel.HEADING_1),
    paragraph('This script runs the same simulation with BATSS in R, outside the app.'),
    ...script
      .trimEnd()
      .split('\n')
      .map(
        (line) =>
          new Paragraph({
            spacing: { after: 0 },
            children: [new TextRun({ text: line, font: 'Courier New', size: 16 })]
          })
      )
  ]
}

/** The run as a Word document, on Letter paper. */
export function buildRunReport(entry: SimulationResultEntry, details: RunReportDetails): Document {
  return new Document({
    creator: 'BATSS Studio',
    title: `${plain(details.designName) || 'Design'} – report`,
    sections: [
      {
        properties: {
          page: {
            size: LETTER,
            margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
          }
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES]
                  })
                ]
              })
            ]
          })
        },
        children: [
          ...titleBlock(entry, details),
          ...(entry.notes
            ? [heading('Notes', HeadingLevel.HEADING_1), ...paragraphs(entry.notes)]
            : []),
          ...designSection(entry),
          ...resultsSections(entry, details.chartPng),
          ...aboutSection(details),
          ...appendix(entry, details)
        ]
      }
    ]
  })
}
