import { PackageCheck, PackageX } from 'lucide-react'
import { type ReactElement } from 'react'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle
} from '@/components/ui/item'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRuntime } from '@/stores/runtime'

export default function About(): ReactElement {
  const status = useRuntime((state) => state.status)
  const checkRuntime = useRuntime((state) => state.checkRuntime)
  const packages = useRuntime((state) => state.packages)
  const logs = useRuntime((state) => state.logs)
  const appVersion = useRuntime((state) => state.appVersion)
  const loadAppVersion = useRuntime((state) => state.loadAppVersion)
  const updatePackages = useRuntime((state) => state.updatePackages)

  const hasUpdates = packages.some((pkg) => pkg.updateAvailable)

  useEffect(() => {
    loadAppVersion()
  }, [loadAppVersion])

  return (
    <div className="overflow-y-auto p-6 grid gap-6">
      <h1 className="text-2xl font-semibold">About</h1>

      <p className="text-muted-foreground">Albatross version {appVersion}</p>
      <p>
        A desktop application facilitating Adaptive Bayesian Clinical (ABC) Trial Design using
        Integrated Nested Laplace Approximations (INLA): ABC-INLA
      </p>
      <Button onClick={() => checkRuntime()} disabled={status === 'checking'} className="max-w-xs">
        Recheck / Install Missing Packages
      </Button>
      <Button
        onClick={() => updatePackages()}
        disabled={status === 'checking' || status === 'installing' || !hasUpdates}
        className="max-w-xs"
      >
        {hasUpdates ? 'Update Packages' : 'Packages Up to Date'}
      </Button>
      <h3>R Packages status:</h3>
      <ItemGroup className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 content-center">
        {packages.map((pkg) => (
          <Item key={pkg.name} variant="outline" size="xs" className="min-w-0 items-start">
            <ItemMedia>
              {pkg.installed ? (
                <PackageCheck className="text-primary" />
              ) : (
                <PackageX className="text-destructive" />
              )}
            </ItemMedia>
            <ItemContent className="min-w-0 gap-1">
              <ItemTitle>{pkg.name}</ItemTitle>

              <ItemDescription>
                {pkg.installed ? (
                  <>
                    Installed · v{pkg.version}
                    {pkg.updateAvailable && (
                      <span className="text-yellow-600"> · Update available</span>
                    )}
                  </>
                ) : (
                  'Not installed'
                )}
              </ItemDescription>
            </ItemContent>
            <ItemActions className="self-center">
              {pkg.updateAvailable ? (
                <span className="text-sm text-yellow-600">v{pkg.latestVersion}</span>
              ) : (
                <span className="text-sm">v{pkg.version ?? 'N/A'}</span>
              )}
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
      {logs.length > 0 && (
        <ScrollArea className="h-48 rounded-md border border-border bg-black p-3">
          <div className="font-mono text-xs text-green-400">
            {logs.map((line, i) => (
              // Index is stable here since lines only ever get
              // appended/trimmed from the front, never reordered.
              <div key={i} className="whitespace-pre-wrap break-all">
                {line}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
