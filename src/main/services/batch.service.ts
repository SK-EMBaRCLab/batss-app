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
    if (!engineService.acquire('batch')) {
      const update: BatchUpdate = {
        status: 'error',
        completed: 0,
        total: inputs.length,
        message: describeBusy(engineService.get())
      }
      onUpdate(update)
      return update
    }

    this.cancelled = false
    const total = inputs.length

    try {
      onUpdate({
        status: 'running',
        completed: 0,
        total,
        message: `Starting batch of ${total} run(s)`
      })

      for (const [index, { input, rowIndex }] of inputs.entries()) {
        if (this.cancelled) {
          const update: BatchUpdate = {
            status: 'cancelled',
            completed: index,
            total,
            message: `Batch cancelled after ${index}/${total} run(s)`
          }
          onUpdate(update)
          return update
        }

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
      }

      const update: BatchUpdate = {
        status: 'done',
        completed: total,
        total,
        message: 'Batch complete'
      }
      onUpdate(update)
      return update
    } finally {
      this.cancelled = false
      engineService.release()
    }
  }
}

export const batchService = new BatchService(simulationService)
