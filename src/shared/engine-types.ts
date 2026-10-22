export type EngineBusy = 'idle' | 'simulation' | 'batch'

export type EngineState = {
  busy: EngineBusy
  startedAt: string | null
}

export function describeBusy(state: EngineState): string {
  switch (state.busy) {
    case 'simulation':
      return 'A simulation is already running. Wait for it to finish or cancel it first.'
    case 'batch':
      return 'A batch is already running. Wait for it to finish or cancel it first.'
    default:
      return 'The simulation engine is busy.'
  }
}

// Taskbar/dock progress styles for a running engine; a subset of
// Electron's ProgressBarOptions['mode'].
export type TaskbarProgressMode = 'normal' | 'indeterminate' | 'error'

// Sent when the user clicks a "run finished" notification, so the
// renderer can open the matching page
export type RunFinishedSummary = {
  kind: Exclude<EngineBusy, 'idle'>
  outcome: 'success' | 'error'
}
