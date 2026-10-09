import { type ReactElement } from 'react'
import { useEffect } from 'react'

import { AboutCredits } from '@/components/about/about-credits'
import { AboutDisclaimer } from '@/components/about/about-disclaimer'
import { AboutHeader } from '@/components/about/about-header'
import { AboutLinks } from '@/components/about/about-links'
import { useRuntime } from '@/stores/runtime'

export default function About(): ReactElement {
  const loadAppVersion = useRuntime((state) => state.loadAppVersion)

  useEffect(() => {
    loadAppVersion()
  }, [loadAppVersion])

  return (
    <div className="overflow-y-auto p-6 lg:p-16 grid gap-8 justify-center text-center">
      <AboutHeader />
      <AboutDisclaimer />
      <AboutCredits />
      <AboutLinks />
    </div>
  )
}
