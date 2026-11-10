import { type ReactElement, useEffect } from 'react'

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
    <div className="grid h-full justify-center gap-8 overflow-y-auto p-6 text-center lg:p-16">
      <AboutHeader />
      <AboutDisclaimer />
      <AboutCredits />
      <AboutLinks />
    </div>
  )
}
