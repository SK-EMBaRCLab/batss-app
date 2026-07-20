// src/main/runtime/r-manager.ts

import { spawn, execFile } from 'child_process'
import { promisify } from 'util'

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
  constructor(private readonly rExecutable = 'Rscript') {}

  async version(): Promise<string> {
    const { stdout } = await execFileAsync(this.rExecutable, ['--version'])

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
  private runProcess(
    args: string[],
    env: NodeJS.ProcessEnv,
    onOutput?: OutputListener
  ): Promise<ExecuteResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.rExecutable, args, { env })

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
