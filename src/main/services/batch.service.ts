// src/main/services/batch.service.ts
import type { BatchPreparedInput, BatchRunEntry, BatchUpdate } from '../../shared/batch-types'
import { describeBusy } from '../../shared/engine-types'
import type { OutputListener } from '../runtime/r-manager'
import { engineService } from './engine.service'
import { SimulationService, simulationService } from './simulation.service'

export class BatchService {
  constructor(private readonly simulation: SimulationService) {}

  private cancelled = false

  /** Cancel a running batch. No-op (returns false) if none is running. */
  cancel(): boolean {
    if (engineService.get().busy !== 'batch') return false
    this.cancelled = true
    this.simulation.abortActive('Batch cancelled by user')
    return true
  }

  async runBatch(
    inputs: BatchPreparedInput[],
    onUpdate: (update: BatchUpdate) => void,
    onRowDone: (entry: BatchRunEntry) => void,
    onOutput?: OutputListener
  ): Promise<BatchUpdate> {
    const emit = (update: BatchUpdate): BatchUpdate => {
      onUpdate(update)
      return update
    }

    if (!engineService.acquire('batch')) {
      return emit({
        status: 'error',
        completed: 0,
        total: inputs.length,
        message: describeBusy(engineService.get())
      })
    }

    this.cancelled = false
    const total = inputs.length

    const cancelledAfter = (count: number): BatchUpdate =>
      emit({
        status: 'cancelled',
        completed: count,
        total,
        message: `Batch cancelled after ${count}/${total} run(s)`
      })

    try {
      onUpdate({
        status: 'running',
        completed: 0,
        total,
        message: `Starting batch of ${total} run(s)`
      })

      for (const [index, { input, rowIndex }] of inputs.entries()) {
        // Cancelled between rows (no run was active to abort)
        if (this.cancelled) return cancelledAfter(index)

        onUpdate({
          status: 'running',
          completed: index,
          total,
          message: `Running row ${rowIndex + 1} (${index + 1}/${total})`
        })

        const result = await this.simulation.execute(input, onOutput)

        onRowDone({
          rowIndex,
          createdAt: new Date().toISOString(),
          input,
          result
        })

        // Cancelled during this row: the run was aborted, but without this
        // check a cancel in the last row would fall through to "done"
        if (this.cancelled) return cancelledAfter(index + 1)
      }

      return emit({ status: 'done', completed: total, total, message: 'Batch complete' })
    } finally {
      this.cancelled = false
      engineService.release()
    }
  }
}

export const batchService = new BatchService(simulationService)
