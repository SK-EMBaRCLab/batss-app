import { type ReactElement } from 'react'
import { useEffect } from 'react'

import { AboutHeader } from '@/components/about/about-header'
import { AboutPackages } from '@/components/about/about-packages'
import { LogViewer } from '@/components/common/log-viewer'
import { useRuntime } from '@/stores/runtime'

export default function About(): ReactElement {
  const logs = useRuntime((state) => state.logs)
  const loadAppVersion = useRuntime((state) => state.loadAppVersion)

  useEffect(() => {
    loadAppVersion()
  }, [loadAppVersion])

  return (
    <div className="overflow-y-auto p-28 grid gap-6 justify-center text-center">
      <AboutHeader />
      <h3>R Packages status:</h3>
      <AboutPackages />
      {logs.length > 0 && <LogViewer logs={logs} className="h-48 text-start" />}
    </div>
  )
}
