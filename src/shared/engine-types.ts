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
