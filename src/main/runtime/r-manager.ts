// src/main/runtime/r-manager.ts

import { execFile, spawn } from 'child_process'
import { existsSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'
import { promisify } from 'util'

import { getRLibraryPath } from '../services/filesystem/app-paths'
import { REQUIRED_R_VERSION } from './r-config'

const execFileAsync = promisify(execFile)

// How long a cancelled R process gets to exit after SIGTERM before its
// whole process group is sent SIGKILL (R/INLA workers can ignore SIGTERM)
const KILL_GRACE_MS = 5000

// Full paths to Windows system tools: a bare name is looked up in the
// current folder before System32, so a planted reg.exe/taskkill.exe there
// would run instead
const WINDOWS_SYSTEM32 = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32')

// Full paths to `fileName` in each PATH folder, searched by hand: a bare
// name would make Windows look in the current folder first, where a
// planted Rscript.exe could be waiting. Relative PATH entries are skipped
// for the same reason.
function findOnWindowsPath(fileName: string): string[] {
  return (process.env.PATH ?? '')
    .split(path.delimiter)
    .map((dir) => dir.trim().replace(/^"(.*)"$/, '$1'))
    .filter((dir) => dir && path.isAbsolute(dir))
    .map((dir) => path.join(dir, fileName))
    .filter((candidate) => existsSync(candidate))
}

// Stops `pid`'s process tree. Windows' taskkill /F is already forceful;
// elsewhere the process group (R plus forked workers) gets `signal`.
function signalProcessTree(pid: number, signal: NodeJS.Signals): void {
  if (process.platform === 'win32') {
    // Without an 'error' listener, taskkill failing to start would be an
    // unhandled error that crashes the main process
    spawn(path.join(WINDOWS_SYSTEM32, 'taskkill.exe'), ['/pid', String(pid), '/T', '/F']).on(
      'error',
      () => {}
    )
    return
  }

  try {
    process.kill(-pid, signal)
  } catch {
    /* already gone */
  }
}

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
  // Keep only the last this-many characters of stdout/stderr, for callers
  // that don't parse R's output (a simulation's results come from a file).
  // Unset keeps everything, which package checks need to parse.
  captureLimit?: number
}

// Longest single line passed on to the log; longer ones are cut, and so is
// a "line" that never ends (e.g. \r-only progress output)
const MAX_LINE_CHARS = 4000

function clipLine(line: string): string {
  return line.length > MAX_LINE_CHARS ? `${line.slice(0, MAX_LINE_CHARS)}… (line truncated)` : line
}

function appendCapped(buffer: string, text: string, limit: number | undefined): string {
  const next = buffer + text
  return limit !== undefined && next.length > limit ? next.slice(next.length - limit) : next
}

export class RManager {
  // R processes still running, so quitting the app can force them down
  private readonly running = new Set<number>()

  /**
   * Immediately force-stops every R process this manager started. For
   * app quit, where there's no time for the usual SIGTERM grace period
   * and nothing is waiting on the results.
   */
  killAll(): void {
    for (const pid of this.running) signalProcessTree(pid, 'SIGKILL')
    this.running.clear()
  }

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
        // PATH (only works if "add to PATH" was checked, or rig)
        ...findOnWindowsPath('Rscript.exe')
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
        const { stdout } = await execFileAsync(path.join(WINDOWS_SYSTEM32, 'reg.exe'), [
          'query',
          key,
          '/v',
          'InstallPath'
        ])
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
          // Newest first, comparing numbers numerically (R-4.10 after R-4.9)
          .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))

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
    return this.runAndReadStdout(['--vanilla', '-e', script], env, onOutput, options)
  }

  async executeFile(
    scriptPath: string,
    env: NodeJS.ProcessEnv = {},
    onOutput?: OutputListener,
    options: ExecuteOptions = {}
  ): Promise<string> {
    return this.runAndReadStdout(['--vanilla', scriptPath], env, onOutput, options)
  }

  private async runAndReadStdout(
    args: string[],
    env: NodeJS.ProcessEnv,
    onOutput?: OutputListener,
    options: ExecuteOptions = {}
  ): Promise<string> {
    const { stdout } = await this.runProcess(
      args,
      await this.buildEnv(env),
      onOutput,
      options
    ).catch((error) => {
      throw this.toExecutionError(error)
    })

    return stdout.trim()
  }

  // R honours R_LIBS_USER natively at interpreter startup (see
  // `?Startup` / `?.libPaths`) — no need to inject a `.libPaths()`
  // prologue into every script by hand. Node creates the directory
  // first, since R only auto-prepends R_LIBS_USER to .libPaths() if it
  // already exists when Rscript launches.
  private async buildEnv(env: NodeJS.ProcessEnv): Promise<NodeJS.ProcessEnv> {
    const libraryPath = getRLibraryPath()

    await fs.mkdir(libraryPath, { recursive: true })

    // R_LIBS and R_LIBS_SITE (e.g. from the user's own R setup) would come
    // before R_LIBS_USER in .libPaths(), so packages could be installed
    // into, and loaded from, a folder outside Albatross's private library
    const inherited: NodeJS.ProcessEnv = { ...process.env }
    delete inherited.R_LIBS
    delete inherited.R_LIBS_SITE

    return {
      ...inherited,
      R_LIBS_USER: libraryPath,
      ...env
    }
  }

  // Runs Rscript via spawn() (not execFile) so stdout/stderr can be read
  // as a stream and forwarded line-by-line to `onOutput`, rather than
  // only being available once the whole process has exited. Still
  // resolves with the full accumulated stdout/stderr for callers (like
  // getStatus) that need to parse the complete output.
  private async runProcess(
    args: string[],
    env: NodeJS.ProcessEnv,
    onOutput?: OutputListener,
    options: ExecuteOptions = {}
  ): Promise<ExecuteResult> {
    const executable = await this.getRExecutable()
    const { signal: externalSignal, timeoutMs, captureLimit } = options

    // Cancelled while the run was still being set up (temp dir, finding
    // Rscript, building the env). An abort listener added below would
    // never fire for a signal that's already aborted, so R would start.
    if (externalSignal?.aborted) throw this.toAbortError(externalSignal)

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

      const pid = child.pid
      let exited = false
      if (pid) this.running.add(pid)
      child.once('exit', () => {
        exited = true
        if (pid) this.running.delete(pid)
      })

      // Ask politely first; force it if R is still around after the grace
      // period, so a cancel can't leave the engine stuck "cancelling"
      const killTree = (): void => {
        if (!pid) return
        signalProcessTree(pid, 'SIGTERM')
        setTimeout(() => {
          if (!exited) signalProcessTree(pid, 'SIGKILL')
        }, KILL_GRACE_MS).unref()
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
        // until more data (or process close) completes it, unless it has
        // grown past the line limit without ever ending.
        tailRef.value = lines.pop() ?? ''
        if (tailRef.value.length > MAX_LINE_CHARS) {
          lines.push(tailRef.value)
          tailRef.value = ''
        }

        for (const line of lines) {
          onOutput?.(clipLine(line), stream)
        }
      }

      const stdoutTailRef = { value: '' }
      const stderrTailRef = { value: '' }

      child.stdout.on('data', (chunk: Buffer) => {
        stdoutBuffer = appendCapped(stdoutBuffer, chunk.toString(), captureLimit)
        consume(chunk, 'stdout', stdoutTailRef)
      })

      child.stderr.on('data', (chunk: Buffer) => {
        stderrBuffer = appendCapped(stderrBuffer, chunk.toString(), captureLimit)
        consume(chunk, 'stderr', stderrTailRef)
      })

      child.on('error', (error) => {
        settleReject(controller.signal.aborted ? this.toAbortError(controller.signal) : error)
      })

      child.on('close', (code) => {
        // Flush any trailing partial line that never got a trailing \n.
        if (stdoutTailRef.value) onOutput?.(clipLine(stdoutTailRef.value), 'stdout')
        if (stderrTailRef.value) onOutput?.(clipLine(stderrTailRef.value), 'stderr')

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
