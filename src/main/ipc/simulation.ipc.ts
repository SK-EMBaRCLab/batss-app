import { BrowserWindow } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import { checkSimulationRunInput } from '../../shared/simulation-input-schema'
import { alertSimulationFinished } from '../services/run-alerts'
import { simulationService } from '../services/simulation.service'
import { batchedLogSender, safeSend } from './safe-send'
import { handle } from './trusted-ipc'

export function registerSimulationIPC(): void {
  handle(IPC.simulation.run, async (event, data: unknown) => {
    const checked = checkSimulationRunInput(data)
    if (!checked.success) return { status: 'error', message: checked.message }

    const log = batchedLogSender(safeSend(event.sender), IPC.simulation.log)
    const result = await simulationService.runSimulation(checked.input, log.push)
    log.flush()

    alertSimulationFinished(BrowserWindow.fromWebContents(event.sender), result)
    return result
  })

  handle(IPC.simulation.cancel, () => {
    return simulationService.cancel()
  })
}
