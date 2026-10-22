import { BrowserWindow, ipcMain } from 'electron'

import { IPC } from '../../shared/ipc-channels'
import type { SimulationRunInput } from '../../shared/simulation-types'
import { alertSimulationFinished } from '../services/run-alerts'
import { simulationService } from '../services/simulation.service'
import { safeSend } from './safe-send'

export function registerSimulationIPC(): void {
  ipcMain.handle(IPC.simulation.run, async (event, input: SimulationRunInput) => {
    const send = safeSend(event.sender)
    const result = await simulationService.runSimulation(input, (line) =>
      send(IPC.simulation.log, line)
    )

    alertSimulationFinished(BrowserWindow.fromWebContents(event.sender), result)
    return result
  })

  ipcMain.handle(IPC.simulation.cancel, () => {
    return simulationService.cancel()
  })
}
