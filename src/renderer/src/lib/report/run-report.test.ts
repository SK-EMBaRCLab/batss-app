import type { SimulationResultEntry } from '@shared/simulation-types'
import { Packer } from 'docx'
import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, test } from 'vitest'

import { buildRunReport, type RunReportDetails } from './run-report'

const DETAILS: RunReportDetails = {
  designName: 'My trial',
  appVersion: '6.2.0',
  generatedAt: '2026-11-11T15:00:00.000Z'
}

const SUCCESS: SimulationResultEntry = {
  id: 'run-1',
  createdAt: '2026-11-10T20:05:00.000Z',
  name: 'Baseline',
  notes: 'For the protocol\nSecond line',
  input: {
    outcomeType: 'binary',
    probability: 0.3,
    treatmentEffectType: 'oddsRatio',
    treatmentEffect: 1.5,
    N: 216,
    m0: 60,
    m: 12,
    R: 10,
    decisionRules: [
      { type: 'superiority', margin: 1, threshold: 0.95 },
      { type: 'futility', margin: 1, threshold: 0.05 }
    ]
  },
  result: {
    status: 'success',
    package: '1.2.1',
    durationMs: 123_000,
    table: [
      { Outcome: 'Inconclusive', 'Null Effect': 0.7, 'Target Effect': 0.2 },
      { Outcome: 'Experimental Superior', 'Null Effect': 0.05, 'Target Effect': 0.75 },
      { Outcome: 'Futility', 'Null Effect': 0.25, 'Target Effect': 0.05 }
    ],
    chart: [],
    sampleSize: {
      H0: { control: [30, 60, 108], experimental: [30, 60, 108] },
      H1: { control: [30, 30, 84], experimental: [30, 30, 84] }
    }
  }
}

const FAILED: SimulationResultEntry = {
  ...SUCCESS,
  name: undefined,
  notes: undefined,
  result: { status: 'error', message: 'R stopped: out of memory' }
}

// The document's text as Word stores it, from inside the .docx
async function documentXml(entry: SimulationResultEntry, details = DETAILS): Promise<string> {
  const file = unzipSync(new Uint8Array(await Packer.toBuffer(buildRunReport(entry, details))))
  return strFromU8(file['word/document.xml'])
}

describe('buildRunReport', () => {
  test('has every section for a successful run, in order', async () => {
    const xml = await documentXml(SUCCESS)
    const sections = [
      'My trial',
      'Baseline',
      'Notes',
      'Design parameters',
      'Outcome probabilities',
      'Sample sizes',
      'About this report',
      'Appendix: R script'
    ]
    const positions = sections.map((text) => xml.indexOf(`>${text}<`))
    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  test("puts the design's description under its name, a paragraph per line", async () => {
    const xml = await documentXml(SUCCESS, {
      ...DETAILS,
      designDescription: 'Phase II trial\nVersion 3'
    })
    const title = xml.indexOf('>My trial<')
    expect(title).toBeGreaterThan(-1)
    expect(xml.indexOf('>Phase II trial<')).toBeGreaterThan(title)
    expect(xml.indexOf('>Version 3<')).toBeLessThan(xml.indexOf('>Baseline<'))
  })

  test('is on Letter paper', async () => {
    const xml = await documentXml(SUCCESS)
    expect(xml).toMatch(/<w:pgSz w:w="12240" w:h="15840"/)
  })

  test('holds the design, the rules and the results as text', async () => {
    const xml = await documentXml(SUCCESS)
    expect(xml).toContain('>Odds Ratio<')
    expect(xml).toContain('>P(OR &gt; 1) &gt; 0.95<')
    expect(xml).toContain('>P(OR &gt; 1) &lt; 0.05<')
    // The outcomes table, superior first, to three places
    expect(xml.indexOf('>Experimental Superior<')).toBeLessThan(xml.indexOf('>Inconclusive<'))
    expect(xml).toContain('>0.750<')
    // Sample sizes: total mean under the null is (60 + 120 + 216) / 3
    expect(xml).toContain('>132<')
    expect(xml).toContain('>90th percentile<')
    // Each line of the notes is its own paragraph
    expect(xml).toContain('>For the protocol<')
    expect(xml).toContain('>Second line<')
  })

  test('ends with the R script', async () => {
    const xml = await documentXml(SUCCESS)
    expect(xml).toContain('>library(BATSS)<')
    expect(xml).toContain('Courier New')
  })

  test('has the design and the error, but no results, for a failed run', async () => {
    const xml = await documentXml(FAILED)
    expect(xml).toContain('>Design parameters<')
    expect(xml).toContain('>R stopped: out of memory<')
    expect(xml).not.toContain('>Outcome probabilities<')
    expect(xml).not.toContain('>Sample sizes<')
    expect(xml).not.toContain('>Notes<')
  })

  test('writes names as plain text', async () => {
    const xml = await documentXml(
      { ...SUCCESS, name: 'A <script> & "B"\u0007' },
      { ...DETAILS, designName: 'Trial\u0000 one' }
    )
    expect(xml).toContain('A &lt;script&gt; &amp;')
    expect(xml).not.toContain('<script>')
    expect(xml).not.toContain('\u0007')
    expect(xml).not.toContain('\u0000')
    expect(xml).toContain('>Trial one<')
  })

  test('puts the chart in when given one', async () => {
    // The smallest valid PNG: 1 × 1 transparent
    const png = Uint8Array.from(
      atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      ),
      (c) => c.charCodeAt(0)
    )
    const xml = await documentXml(SUCCESS, { ...DETAILS, chartPng: png })
    expect(xml).toContain('Outcome chart')
    expect(xml).toContain('<w:drawing>')
  })
})
