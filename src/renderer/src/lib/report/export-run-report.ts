// Saving a run's Word report: the chart drawn as a PNG (which needs the
// browser), the document built, and the file offered through the app's
// Save dialog like the other exports.
import type { SimulationResultEntry } from '@shared/simulation-types'
import { Packer } from 'docx'

import { runExportFileName, saveExport } from '@/lib/download'

import { outcomeChartSvg, svgToPng } from './outcome-chart-svg'
import { buildRunReport } from './run-report'

/** Asks where to save the run's report. False if the user cancelled. */
export async function exportRunReport(
  entry: SimulationResultEntry,
  { designName, appVersion }: { designName: string; appVersion: string }
): Promise<boolean> {
  const chartPng =
    entry.result.status === 'success'
      ? await svgToPng(outcomeChartSvg(entry.result.chart))
      : undefined

  const document = buildRunReport(entry, {
    designName,
    appVersion,
    generatedAt: new Date().toISOString(),
    chartPng
  })

  return saveExport(
    runExportFileName(designName, 'report', entry.createdAt, 'docx'),
    await Packer.toBlob(document)
  )
}
