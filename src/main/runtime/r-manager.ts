// src/main/runtime/r-manager.ts

import { execFile, spawn } from 'child_process'
import fs from 'fs/promises'
import path from 'path'
import { promisify } from 'util'

import { getRLibraryPath } from '../services/filesystem/app-paths'
import { REQUIRED_R_VERSION } from './r-config'

const execFileAsync = promisify(execFile)

type ExecuteResult = { stdout: string; stderr: string }

/** Called with each complete line of output as it arrives, tagged with
 * which stream it came from. Used to stream install progress (compiler
 * output, `install.packages()` messages, etc.) to the renderer in real
 * time instead of only after the whole R process exits. */
export type OutputListener = (line: string, stream: 'stdout' | 'stderr') => void

/**
 * Options for cancelling or bounding a long-running R process.
 *  - `signal`    lets a caller (e.g. a "Cancel" button) abort an
 *    in-flight run on demand.
 *  - `timeoutMs` aborts the run automatically if it hasn't finished in
 *    time, so a hung INLA/BATSS call can't leave the app stuck forever
 *    in a "Running" state with no recovery short of a restart.
 */
export type ExecuteOptions = {
  signal?: AbortSignal
  timeoutMs?: number
}

export class RManager {
  private resolvedExecutable?: string

  private async getCandidates(): Promise<string[]> {
    if (process.platform === 'darwin') {
      return [
        'Rscript',
        '/Library/Frameworks/R.framework/Resources/bin/Rscript', // CRAN
        '/opt/homebrew/bin/Rscript', // Apple Silicon Homebrew
        '/usr/local/bin/Rscript' // Intel Homebrew
      ]
    }

    if (process.platform === 'win32') {
      return [
        ...(await this.getWindowsInstallCandidates()),
        'Rscript.exe' // PATH (only works if "add to PATH" was checked, or rig)
      ]
    }

    return ['Rscript', '/usr/bin/Rscript', '/usr/local/bin/Rscript']
  }

  /**
   * The CRAN Windows installer does NOT add R to PATH by default, so
   * relying on 'Rscript.exe' alone (the old behavior) fails on most
   * fresh Windows installs even though R is present. R-core does write
   * its install location to the registry on setup, and that's more
   * reliable than PATH — check that first, then fall back to scanning
   * the default Program Files install directory.
   */
  private async getWindowsInstallCandidates(): Promise<string[]> {
    const candidates: string[] = []

    for (const key of [
      'HKLM\\SOFTWARE\\R-core\\R64',
      'HKLM\\SOFTWARE\\R-core\\R',
      'HKCU\\SOFTWARE\\R-core\\R64',
      'HKCU\\SOFTWARE\\R-core\\R'
    ]) {
      try {
        const { stdout } = await execFileAsync('reg', ['query', key, '/v', 'InstallPath'])
        const match = stdout.match(/InstallPath\s+REG_SZ\s+(.+)/)

        if (match) {
          const installPath = match[1].trim()
          candidates.push(path.join(installPath, 'bin', 'x64', 'Rscript.exe'))
        }
      } catch {
        // This particular registry key doesn't exist on this machine —
        // not every user has every combination of 32/64-bit R and
        // HKLM/HKCU installs. Try the next one.
      }
    }

    // Fallback: scan the default install directory directly, in case
    // the registry lookup above didn't turn up anything. R version
    // folders are named "R-4.x.y", so we can't hardcode a path — glob
    // for them and prefer the newest.
    for (const programFiles of [process.env['ProgramFiles'], process.env['ProgramFiles(x86)']]) {
      if (!programFiles) continue

      const rDir = path.join(programFiles, 'R')

      try {
        const entries = await fs.readdir(rDir)
        const preferred = entries.find((v) => v === `R-${REQUIRED_R_VERSION}`)
        if (preferred) {
          candidates.push(path.join(rDir, preferred, 'bin', 'x64', 'Rscript.exe'))
        }
        const versions = entries
          .filter((v) => v.startsWith('R-'))
          .sort()
          .reverse()

        for (const version of versions) {
          candidates.push(path.join(rDir, version, 'bin', 'x64', 'Rscript.exe'))
        }
      } catch {
        // No R directory under this Program Files — fine, try the next.
      }
    }

    return candidates
  }

  private async getRExecutable(): Promise<string> {
    if (this.resolvedExecutable) {
      return this.resolvedExecutable
    }

    const candidates = await this.getCandidates()

    for (const executable of candidates) {
      try {
        await execFileAsync(executable, ['--version'])
        this.resolvedExecutable = executable
        return executable
      } catch {
        // Try the next candidate.
      }
    }

    throw new Error(`Unable to locate Rscript. Tried:\n${candidates.join('\n')}`)
  }

  async version(): Promise<string> {
    const executable = await this.getRExecutable()
    const { stdout } = await execFileAsync(executable, ['--version'])

    return stdout.trim()
  }

  async rVersion(): Promise<string> {
    return this.evaluate<string>(`
      paste(R.version$major, R.version$minor, sep = ".")
    `)
  }

  async isInstalled(): Promise<boolean> {
    try {
      await this.version()

      return true
    } catch {
      return false
    }
  }

  /**
   * Execute an R script. Extra values that the script needs (package
   * names, paths, etc.) should be passed via `env` and read inside the
   * script with Sys.getenv("KEY") rather than interpolated into `script`.
   *
   * If `onOutput` is provided, each line of stdout/stderr is streamed to
   * it as the R process produces it (this is what lets long-running
   * steps like package installs show live output in the GUI instead of
   * only a final result once everything finishes).
   */
  async execute(
    script: string,
    env: NodeJS.ProcessEnv = {},
    onOutput?: OutputListener,
    options: ExecuteOptions = {}
  ): Promise<string> {
    const { stdout } = await this.runProcess(
      ['--vanilla', '-e', script],
      await this.buildEnv(env),
      onOutput,
      options
    ).catch((error) => {
      throw this.toExecutionError(error)
    })

    return stdout.trim()
  }

  async executeFile(
    scriptPath: string,
    env: NodeJS.ProcessEnv = {},
    onOutput?: OutputListener,
    options: ExecuteOptions = {}
  ): Promise<string> {
    const { stdout } = await this.runProcess(
      ['--vanilla', scriptPath],
      await this.buildEnv(env),
      onOutput,
      options
    ).catch((error) => {
      throw this.toExecutionError(error)
    })

    return stdout.trim()
  }

  async evaluate<T>(
    script: string,
    env: NodeJS.ProcessEnv = {},
    onOutput?: OutputListener
  ): Promise<T> {
    const result = await this.execute(
      `
        result <- ${script}

        cat(
          jsonlite::toJSON(
            result,
            auto_unbox = TRUE
          )
        )
      `,
      env,
      onOutput
    )

    return JSON.parse(result) as T
  }

  // R honours R_LIBS_USER natively at interpreter startup (see
  // `?Startup` / `?.libPaths`) — no need to inject a `.libPaths()`
  // prologue into every script by hand. Node creates the directory
  // first, since R only auto-prepends R_LIBS_USER to .libPaths() if it
  // already exists when Rscript launches.
  private async buildEnv(env: NodeJS.ProcessEnv): Promise<NodeJS.ProcessEnv> {
    const libraryPath = getRLibraryPath()

    await fs.mkdir(libraryPath, { recursive: true })

    return {
      ...process.env,
      R_LIBS_USER: libraryPath,
      ...env
    }
  }

  // Runs Rscript via spawn() (not execFile) so stdout/stderr can be read
  // as a stream and forwarded line-by-line to `onOutput`, rather than
  // only being available once the whole process has exited. Still
  // resolves with the full accumulated stdout/stderr for callers (like
  // getStatus/evaluate) that need to parse the complete output.
  private async runProcess(
    args: string[],
    env: NodeJS.ProcessEnv,
    onOutput?: OutputListener,
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    const executable = await this.getRExecutable()
    const { signal: externalSignal, timeoutMs } = options

    return new Promise((resolve, reject) => {
      // Own AbortController so spawn() only has to know about one
      // signal, regardless of whether the abort came from the caller
      // (Cancel button) or from timeoutMs elapsing.
      const controller = new AbortController()

      const onExternalAbort = (): void => controller.abort(externalSignal?.reason)
      externalSignal?.addEventListener('abort', onExternalAbort)

      const timeoutHandle = timeoutMs
        ? setTimeout(() => {
            controller.abort(
              new Error(`R process timed out after ${Math.round(timeoutMs / 1000)}s`)
            )
          }, timeoutMs)
        : undefined

      const childEnv: NodeJS.ProcessEnv = { ...env }

      const child = spawn(executable, args, {
        env: childEnv,
        detached: process.platform !== 'win32', // own process group → forked/PSOCK workers included
        windowsHide: true
      })

      const killTree = (): void => {
        if (!child.pid) return
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'])
        } else {
          try {
            process.kill(-child.pid, 'SIGTERM')
          } catch {
            /* already gone */
          }
        }
      }
      controller.signal.addEventListener('abort', killTree, { once: true })

      let stdoutBuffer = ''
      let stderrBuffer = ''
      let settled = false

      const cleanup = (): void => {
        if (timeoutHandle) clearTimeout(timeoutHandle)
        externalSignal?.removeEventListener('abort', onExternalAbort)
      }

      const settleResolve = (result: ExecuteResult): void => {
        if (settled) return
        settled = true
        cleanup()
        resolve(result)
      }

      const settleReject = (error: unknown): void => {
        if (settled) return
        settled = true
        cleanup()
        reject(error)
      }

      const consume = (
        chunk: Buffer,
        stream: 'stdout' | 'stderr',
        tailRef: { value: string }
      ): void => {
        tailRef.value += chunk.toString()
        const lines = tailRef.value.split('\n')
        // Last element may be an incomplete line — keep it buffered
        // until more data (or process close) completes it.
        tailRef.value = lines.pop() ?? ''

        for (const line of lines) {
          onOutput?.(line, stream)
        }
      }

      const stdoutTailRef = { value: '' }
      const stderrTailRef = { value: '' }

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBuffer += chunk.toString()
        consume(chunk, 'stdout', stdoutTailRef)
      })

      child.stderr.on('data', (chunk: Buffer) => {
        stderrBuffer += chunk.toString()
        consume(chunk, 'stderr', stderrTailRef)
      })

      child.on('error', (error) => {
        settleReject(controller.signal.aborted ? this.toAbortError(controller.signal) : error)
      })

      child.on('close', (code) => {
        // Flush any trailing partial line that never got a trailing \n.
        if (stdoutTailRef.value) onOutput?.(stdoutTailRef.value, 'stdout')
        if (stderrTailRef.value) onOutput?.(stderrTailRef.value, 'stderr')

        if (controller.signal.aborted) {
          settleReject(this.toAbortError(controller.signal))
          return
        }

        if (code === 0) {
          settleResolve({ stdout: stdoutBuffer, stderr: stderrBuffer })
        } else {
          settleReject({
            message: `Rscript exited with code ${code}`,
            stdout: stdoutBuffer,
            stderr: stderrBuffer
          })
        }
      })
    })
  }

  // Produces a consistent, user-facing message whether the process was
  // cancelled on purpose or hit timeoutMs. Tagging `name = 'AbortError'`
  // lets toExecutionError() pass the message through unwrapped instead
  // of prefixing it with "R execution failed:".
  private toAbortError(signal: AbortSignal): Error {
    const reason = signal.reason
    const error =
      reason instanceof Error ? new Error(reason.message) : new Error('Simulation cancelled')
    error.name = 'AbortError'
    return error
  }

  private toExecutionError(error: unknown): Error {
    // Cancellations/timeouts already carry a clear, user-facing message
    // (see toAbortError) — pass them through as-is instead of wrapping.
    if (error instanceof Error && error.name === 'AbortError') {
      return error
    }

    if (error && typeof error === 'object') {
      const err = error as { message?: string; stderr?: string; stdout?: string }
      const tail = (text: string, lines = 25): string =>
        text.trim().split(/\r?\n/).slice(-lines).join('\n')
      const detail = tail(err.stderr || err.stdout || '')

      if (detail) {
        return new Error(`R execution failed: ${detail}`)
      }

      if (err.message) {
        return new Error(`R execution failed: ${err.message}`)
      }
    }

    return new Error('R execution failed')
  }
}

// Shared singleton. RManager caches the resolved Rscript executable on
// the instance (see getRExecutable), so constructing a fresh instance
// per call — as bootstrap.ts and simulation.service.ts previously did —
// meant that cache never survived past a single operation. Every
// runtime check, package install, and simulation run re-walked the
// full candidate list, including Windows registry queries. Importing
// this singleton instead lets the resolved path persist for the life
// of the app.
export const rManager = new RManager()
