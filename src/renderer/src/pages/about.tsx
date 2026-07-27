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
import { PackageCheck, PackageX } from 'lucide-react'
import { useEffect } from 'react'

export default function About() {
  const status = useRuntime((state) => state.status)
  const checkRuntime = useRuntime((state) => state.checkRuntime)
  const packages = useRuntime((state) => state.packages)
  const logs = useRuntime((state) => state.logs)
  const appVersion = useRuntime((state) => state.appVersion)
  const loadAppVersion = useRuntime((state) => state.loadAppVersion)

  console.log(packages)

  useEffect(() => {
    loadAppVersion()
  }, [loadAppVersion])

  return (
    <div className="h-full overflow-y-auto p-6 grid gap-4">
      <h1 className="text-2xl font-semibold">About</h1>

      <p className="text-muted-foreground">Albatross version {appVersion}</p>
      <Button onClick={() => checkRuntime()} disabled={status === 'checking'} className="max-w-sm">
        Recheck / Install Packages
      </Button>
      <h3>R Packages status:</h3>
      <ItemGroup className="max-w-sm">
        {packages.map((pkg) => (
          <Item key={pkg.name} variant="outline" size="xs">
            <ItemMedia>
              {pkg.installed ? (
                <PackageCheck className="text-primary" />
              ) : (
                <PackageX className="text-destructive" />
              )}
            </ItemMedia>
            <ItemContent className="gap-1">
              <ItemTitle>{pkg.name}</ItemTitle>
              <ItemDescription>{pkg.installed ? 'installed' : 'not installed'}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <span>v{pkg.version}</span>
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
