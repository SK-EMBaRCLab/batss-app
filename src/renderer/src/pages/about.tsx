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
import { useRuntime } from '@/stores/runtime'
import { PackageCheck, PackageX } from 'lucide-react'

export default function About() {
  const status = useRuntime((state) => state.status)
  const checkRuntime = useRuntime((state) => state.checkRuntime)
  const packages = useRuntime((state) => state.packages)

  return (
    <div className="p-6 grid gap-4">
      <h1 className="text-2xl font-semibold">About</h1>

      <p className="text-muted-foreground mt-2">About Albatross</p>
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
    </div>
  )
}
