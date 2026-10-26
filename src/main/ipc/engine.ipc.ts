import { IPC } from '../../shared/ipc-channels'
import { engineService } from '../services/engine.service'
import { broadcast } from './safe-send'
import { handle } from './trusted-ipc'

export function registerEngineIPC(): void {
  handle(IPC.engine.get, () => engineService.get())

  // Global state → every window, same pattern as theme:updated.
  engineService.subscribe((state) => broadcast(IPC.engine.state, state))
}
