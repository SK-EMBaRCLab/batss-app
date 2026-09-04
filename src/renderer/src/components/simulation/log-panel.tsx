import { type ReactElement } from 'react'

import { formatDuration } from '@/lib/utils'

import { LogViewer } from '../log-viewer'

type LogPanelProps = {
  logs: string[]
  isRunning: boolean
  elapsedSeconds: number
}

export function LogPanel({ logs, isRunning, elapsedSeconds }: LogPanelProps): ReactElement {
  return (
    <LogViewer
      logs={logs}
      header={
        isRunning ? (
          <>
            <div>{'> Running BATSS simulation...'}</div>
            <div>{`> Elapsed: ${formatDuration(elapsedSeconds)}`}</div>
            <div />
          </>
        ) : undefined
      }
    />
  )
}
