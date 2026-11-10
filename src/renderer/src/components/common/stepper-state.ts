export type StepState = {
  /** Reached and left behind: shown with a check mark. */
  completed: boolean
  active: boolean
  clickable: boolean
}

/**
 * How a step shows in the stepper. Every step up to the furthest one
 * reached can be clicked, so going back doesn't lock the steps after it;
 * while a run is in progress (allowAnyStep) every step can be.
 */
export function stepState(
  index: number,
  {
    currentStep,
    reachedStep,
    allowAnyStep
  }: {
    currentStep: number
    reachedStep: number
    allowAnyStep: boolean
  }
): StepState {
  const active = index === currentStep
  return {
    completed: !active && index < reachedStep,
    active,
    clickable: allowAnyStep || index <= reachedStep
  }
}
