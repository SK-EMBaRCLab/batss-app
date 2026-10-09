import { ExternalLink } from 'lucide-react'
import { type ReactElement } from 'react'

import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item'

// Mirrors the README's own Acknowledgments section — same credits, same
// wording, just surfaced where users actually are instead of only on
// GitHub.
const CREDITS = [
  {
    name: 'BATSS',
    description:
      'The Bayesian Adaptive Trial Simulator Software R package this app is built around.',
    url: 'https://batss-dev.github.io/BATSS/'
  },
  {
    name: 'R-INLA',
    description:
      'Integrated Nested Laplace Approximation, the inference engine BATSS uses under the hood.',
    url: 'https://www.r-inla.org/'
  },
  {
    name: 'Electron / electron-vite',
    description: 'Desktop application framework and build tooling.',
    url: 'https://www.electronjs.org/'
  }
] as const

export function AboutCredits(): ReactElement {
  return (
    <div className="w-full max-w-xl justify-self-center text-left">
      <h2 className="mb-3 text-center text-sm font-semibold text-muted-foreground">Built with</h2>

      <ItemGroup>
        {CREDITS.map((credit) => (
          <Item
            key={credit.name}
            variant="outline"
            size="sm"
            render={
              <a href={credit.url} target="_blank" rel="noreferrer">
                <ItemContent>
                  <ItemTitle>{credit.name}</ItemTitle>
                  <ItemDescription>{credit.description}</ItemDescription>
                </ItemContent>
                <ExternalLink className="size-4 shrink-0 text-muted-foreground" />
              </a>
            }
          />
        ))}
      </ItemGroup>
    </div>
  )
}
