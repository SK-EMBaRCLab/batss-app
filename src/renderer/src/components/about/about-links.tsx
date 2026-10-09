import { Bug, FolderGit2, Globe, HeartHandshake } from 'lucide-react'
import { type ReactElement } from 'react'

import { Button } from '@/components/ui/button'

const REPO_URL = 'https://github.com/SK-EMBaRCLab/batss-app'
const LAB_URL = 'https://lab.research.sickkids.ca/heath/'
const LICENSE_URL = 'https://www.gnu.org/licenses/gpl-3.0'
const DSI_URL = 'https://datasciences.utoronto.ca/research-software-development-support-program/'

export function AboutLinks(): ReactElement {
  return (
    <div className="grid justify-items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          render={<a href={REPO_URL} target="_blank" rel="noreferrer" />}
        >
          <FolderGit2 />
          Source Code
        </Button>

        <Button
          variant="outline"
          size="sm"
          render={<a href={`${REPO_URL}/issues/new`} target="_blank" rel="noreferrer" />}
        >
          <Bug />
          Report an Issue
        </Button>

        <Button
          variant="outline"
          size="sm"
          render={<a href={LAB_URL} target="_blank" rel="noreferrer" />}
        >
          <Globe />
          Heath Lab
        </Button>

        <Button
          variant="outline"
          size="sm"
          render={<a href={DSI_URL} target="_blank" rel="noreferrer" />}
        >
          <HeartHandshake />
          Data Sciences Institute
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} Heath Lab, SickKids · Licensed under{' '}
        <a href={LICENSE_URL} target="_blank" rel="noreferrer" className="underline">
          GPL-3.0
        </a>
      </p>
    </div>
  )
}
