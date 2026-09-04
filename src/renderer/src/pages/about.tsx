import { type ReactElement } from 'react'
import { useEffect } from 'react'

import { AboutHeader } from '@/components/about/about-header'
import { AboutPackages } from '@/components/about/about-packages'
import { LogViewer } from '@/components/log-viewer'
import { useRuntime } from '@/stores/runtime'

export default function About(): ReactElement {
  const logs = useRuntime((state) => state.logs)
  const loadAppVersion = useRuntime((state) => state.loadAppVersion)

  useEffect(() => {
    loadAppVersion()
  }, [loadAppVersion])

  return (
    <div className="overflow-y-auto p-6 grid gap-6">
      <AboutHeader />
      <h3>R Packages status:</h3>
      <AboutPackages />
      {logs.length > 0 && <LogViewer logs={logs} className="h-48" />}
    </div>
  )
}
