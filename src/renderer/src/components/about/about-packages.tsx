import { PackageCheck, PackageX } from 'lucide-react'
import { type ReactElement } from 'react'

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

export function AboutPackages(): ReactElement {
  const packages = useRuntime((state) => state.packages)

  return (
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
  )
}
