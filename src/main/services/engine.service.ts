import type { EngineBusy, EngineState } from '../../shared/engine-types'

type Listener = (state: EngineState) => void

/**
 * The single source of truth for "is R doing something right now".
 * Exactly one owner (a simulation or a batch) may hold the engine at a
 * time; everything else — buttons, spinners, cancel routing — derives
 * from this.
 */
class EngineService {
  private state: EngineState = { busy: 'idle', startedAt: null }
  private readonly listeners = new Set<Listener>()

  get(): EngineState {
    return this.state
  }

  /** Claim the engine. Returns false if someone else already holds it. */
  acquire(kind: Exclude<EngineBusy, 'idle'>): boolean {
    if (this.state.busy !== 'idle') return false
    this.update({ busy: kind, startedAt: new Date().toISOString() })
    return true
  }

  release(): void {
    this.update({ busy: 'idle', startedAt: null })
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private update(state: EngineState): void {
    this.state = state
    for (const listener of this.listeners) listener(state)
  }
}

export const engineService = new EngineService()
