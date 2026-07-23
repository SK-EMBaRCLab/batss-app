// src/main/runtime/r-manager.ts

import { spawn, execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

import { getRLibraryPath } from '../services/filesystem/app-paths'

const execFileAsync = promisify(execFile)

const R_LIBRARY_PATH_ENV = 'ALBATROSS_R_LIBRARY_PATH'

type ExecuteResult = { stdout: string; stderr: string }

/** Called with each complete line of output as it arrives, tagged with
 * which stream it came from. Used to stream install progress (compiler
 * output, `install.packages()` messages, etc.) to the renderer in real
 * time instead of only after the whole R process exits. */
export type OutputListener = (line: string, stream: 'stdout' | 'stderr') => void

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
        'Rscript.exe', // PATH (only works if "add to PATH" was checked, or rig)
        ...(await this.getWindowsInstallCandidates())
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
          candidates.push(path.join(installPath, 'bin', 'Rscript.exe'))
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
        const versions = entries
          .filter((v) => v.startsWith('R-'))
          .sort()
          .reverse()

        for (const version of versions) {
          candidates.push(path.join(rDir, version, 'bin', 'x64', 'Rscript.exe'))
          candidates.push(path.join(rDir, version, 'bin', 'Rscript.exe'))
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
    onOutput?: OutputListener
  ): Promise<string> {
    const wrappedScript = this.wrapScript(script)
    const libraryPath = getRLibraryPath()

    const { stdout } = await this.runProcess(
      ['-e', wrappedScript],
      {
        ...process.env,
        [R_LIBRARY_PATH_ENV]: libraryPath,
        ...env
      },
      onOutput
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

  private wrapScript(script: string): string {
    return `
      library_path <- Sys.getenv("${R_LIBRARY_PATH_ENV}")

      dir.create(
        library_path,
        recursive = TRUE,
        showWarnings = FALSE
      )

      .libPaths(
        c(
          library_path,
          .libPaths()
        )
      )

      ${script}
    `
  }

  // Runs Rscript via spawn() (not execFile) so stdout/stderr can be read
  // as a stream and forwarded line-by-line to `onOutput`, rather than
  // only being available once the whole process has exited. Still
  // resolves with the full accumulated stdout/stderr for callers (like
  // getStatus/evaluate) that need to parse the complete output.
  private async runProcess(
    args: string[],
    env: NodeJS.ProcessEnv,
    onOutput?: OutputListener
  ): Promise<ExecuteResult> {
    const executable = await this.getRExecutable()
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, { env })

      let stdoutBuffer = ''
      let stderrBuffer = ''

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
        reject(error)
      })

      child.on('close', (code) => {
        // Flush any trailing partial line that never got a trailing \n.
        if (stdoutTailRef.value) onOutput?.(stdoutTailRef.value, 'stdout')
        if (stderrTailRef.value) onOutput?.(stderrTailRef.value, 'stderr')

        if (code === 0) {
          resolve({ stdout: stdoutBuffer, stderr: stderrBuffer })
        } else {
          reject({
            message: `Rscript exited with code ${code}`,
            stdout: stdoutBuffer,
            stderr: stderrBuffer
          })
        }
      })
    })
  }

  private toExecutionError(error: unknown): Error {
    if (error && typeof error === 'object') {
      const err = error as { message?: string; stderr?: string; stdout?: string }
      const detail = (err.stderr || err.stdout || '').trim()

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
