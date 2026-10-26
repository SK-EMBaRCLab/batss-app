import { IPC } from '../../shared/ipc-channels'
import { updateService } from '../services/update.service'
import { broadcast } from './safe-send'
import { handle } from './trusted-ipc'

export function registerUpdateIPC(): void {
  updateService.init()

  handle(IPC.update.get, () => updateService.get())

  handle(IPC.update.check, (_event, silent: unknown) => updateService.check(silent === true))

  handle(IPC.update.download, () => updateService.download())

  handle(IPC.update.install, () => updateService.install())

  // Global state → every window, same pattern as engine:state.
  updateService.subscribe((state) => broadcast(IPC.update.status, state))
}
