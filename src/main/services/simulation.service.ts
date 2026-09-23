import { app } from 'electron'
import { mkdtemp, readFile, rm } from 'fs/promises'
import os from 'os'
import path from 'path'

import { describeBusy } from '../../shared/engine-types'
import type { SimulationRunInput, SimulationRunResult } from '../../shared/simulation-types'
import { OutputListener, rManager } from '../runtime/r-manager'
import { engineService } from './engine.service'

const BATSS_INPUT_ENV = 'ALBATROSS_BATSS_INPUT'
const BATSS_OUTPUT_ENV = 'ALBATROSS_BATSS_OUTPUT'

// BATSS/INLA runs are usually seconds to a few minutes, but a
// pathological set of inputs (huge N/R, a model that fails to
// converge, etc.) can hang indefinitely. Without a ceiling, a hung run
// leaves the UI stuck in "Running" forever with no way out but
// restarting the app.
const SIMULATION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

// resources/** is asarUnpack'd (see electron-builder.yml), so in a
// packaged build the real, directly-openable file lives next to
// app.asar (under app.asar.unpacked), not inside it. Rscript is an
// external, non-Electron process with no asar awareness at all —
// handing it any path that lexically resolves inside app.asar (e.g.
// one built from compiled main-process code's own __dirname, which
// itself lives inside app.asar) fails with ENOTDIR, since app.asar is
// an ordinary file, not a real directory, to every process but
// Electron's own patched Node.
function getSimulationScriptPath(): string {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'resources',
      'r',
      'batss-simulation.R'
    )
  }

  return path.join(process.cwd(), 'resources', 'r', 'batss-simulation.R')
}

export class SimulationService {
  private readonly r = rManager

  // Cancellation handle for whichever Rscript is currently alive. This
  // is no longer the "busy" lock — engineService is — it's just how we
  // reach the process to abort it.
  private activeRun: { controller: AbortController } | null = null

  /**
   * Runs the 2-arm binomial BATSS design (batss.glm with rbinom /
   * alloc.balanced / eff.arm.simple) using parameters supplied by the
   * frontend form, rather than the hardcoded normal-outcome demo used
   * previously.
   *
   * Parameters are passed into R as a single JSON blob via an
   * environment variable and decoded with jsonlite::fromJSON — same
   * reasoning as everywhere else in this codebase: never interpolate
   * externally-sourced values into R source text. jsonlite is safe to
   * rely on here (unlike in PackageManager.getStatus) because this only
   * ever runs after the runtime bootstrap has confirmed it's installed.
   *
   * `onOutput`, if provided, receives each line of R/INLA output as it
   * streams, so the caller can forward it to the GUI live.
   */
  async runSimulation(
    input: SimulationRunInput,
    onOutput?: OutputListener
  ): Promise<SimulationRunResult> {
    if (!engineService.acquire('simulation')) {
      return { status: 'error', message: describeBusy(engineService.get()) }
    }

    try {
      return await this.execute(input, onOutput)
    } finally {
      engineService.release()
    }
  }

  /** Cancel a standalone run. No-op (returns false) during a batch. */
  cancel(): boolean {
    if (engineService.get().busy !== 'simulation') return false
    return this.abortActive('Simulation cancelled by user')
  }
  /**
   * Runs exactly one Rscript. Does NOT touch the engine lock — the
   * caller owns that (runSimulation above, or BatchService for a row).
   */
  async execute(
    input: SimulationRunInput,
    onOutput?: OutputListener
  ): Promise<SimulationRunResult> {
    const controller = new AbortController()
    this.activeRun = { controller }

    const alternative = input.decisionRules[0]?.direction ?? 'greater'

    let family = ''
    let link = ''
    let varY = ''

    switch (input.outcomeType) {
      case 'binary':
        family = 'binomial'
        link = 'logit'
        varY = 'rbinom'
        break
      case 'continuous':
        family = 'gaussian'
        link = 'identity'
        varY = 'rnorm'
        break
      case 'ordinal':
        family = 'binomial'
        link = 'logit'
        varY = 'rbinom'
        break
      default:
        family = 'binomial'
        link = 'logit'
        varY = 'rbinom'
        break
    }

    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'albatross-'))
    const outputPath = path.join(tmpDir, 'result.json')

    try {
      await this.r.executeFile(
        getSimulationScriptPath(),
        {
          [BATSS_INPUT_ENV]: JSON.stringify({ ...input, alternative, family, link, varY }),
          [BATSS_OUTPUT_ENV]: outputPath
        },
        onOutput,
        { signal: controller.signal, timeoutMs: SIMULATION_TIMEOUT_MS }
      )
      return JSON.parse(await readFile(outputPath, 'utf8')) as SimulationRunResult
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Simulation run failed'
      }
    } finally {
      this.activeRun = null
      await rm(tmpDir, { recursive: true, force: true })
    }
  }
  /** Abort whatever Rscript is alive, regardless of who owns the engine. */
  abortActive(reason: string): boolean {
    if (!this.activeRun) return false
    this.activeRun.controller.abort(new Error(reason))
    return true
  }
}

export const simulationService = new SimulationService()
