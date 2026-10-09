import { type ReactElement } from 'react'

import { useRuntime } from '@/stores/runtime'

export function AboutHeader(): ReactElement {
  const appVersion = useRuntime((state) => state.appVersion)

  return (
    <>
      <small className="text-muted-foreground">Version {appVersion}</small>
      <h1 className="text-6xl font-semibold">Albatross</h1>
      <p>
        A desktop application facilitating Adaptive Bayesian Clinical (ABC) Trial Design using
        Integrated Nested Laplace Approximations (INLA): ABC-INLA
      </p>
    </>
  )
}
