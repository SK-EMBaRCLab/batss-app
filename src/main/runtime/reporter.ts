// src/main/runtime/reporter.ts

import type { RuntimeStatus, RuntimeUpdate } from './types'

export class RuntimeReporter {
  constructor(
    private readonly send: (update: RuntimeUpdate) => void,
    // Separate from `send`: raw R stdout/stderr lines, streamed as they
    // happen. Kept on its own channel rather than folded into
    // RuntimeUpdate.message so the structured status line ("Installing
    // fmesher", progress %) and the noisy line-by-line console output
    // don't overwrite each other.
    private readonly sendLog?: (line: string) => void
  ) {}

  private emit(status: RuntimeStatus, progress: number, message: string): void {
    this.send({
      status,
      progress,
      message
    })
  }

  checking(message: string, progress: number): void {
    this.emit('checking', progress, message)
  }

  installing(message: string, progress: number): void {
    this.emit('installing', progress, message)
  }

  ready(message = 'Runtime ready'): void {
    this.emit('ready', 100, message)
  }

  error(message: string): void {
    this.emit('error', 100, message)
  }

  log(line: string): void {
    this.sendLog?.(line)
  }
}
