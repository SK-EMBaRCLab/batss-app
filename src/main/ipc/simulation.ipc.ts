import { BrowserWindow, ipcMain } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import { checkSimulationRunInput } from '../../shared/simulation-input-schema'
import { alertSimulationFinished } from '../services/run-alerts'
import { simulationService } from '../services/simulation.service'
import { safeSend } from './safe-send'

export function registerSimulationIPC(): void {
  ipcMain.handle(IPC.simulation.run, async (event, data: unknown) => {
    const checked = checkSimulationRunInput(data)
    if (!checked.success) return { status: 'error', message: checked.message }

    const send = safeSend(event.sender)
    const result = await simulationService.runSimulation(checked.input, (line) =>
      send(IPC.simulation.log, line)
    )

    alertSimulationFinished(BrowserWindow.fromWebContents(event.sender), result)
    return result
  })

  ipcMain.handle(IPC.simulation.cancel, () => {
    return simulationService.cancel()
  })
}
