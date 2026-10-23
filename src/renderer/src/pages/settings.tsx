import { type ReactElement } from 'react'

import {
  AppIconSetting,
  ColorSchemeSetting,
  NotifySetting,
  UpdatesSetting
} from '@/components/settings/general-settings'
import {
  OutputLocationSetting,
  SimulationTimeoutSetting
} from '@/components/settings/simulation-settings'

export default function Settings(): ReactElement {
  return (
    <div className="h-full overflow-y-auto">
      {/* Same column and padding as the other pages, so the heading starts
          in the same place. Settings are grouped into two narrow (max-w-2xl)
          columns side by side once this content area is 64rem wide (a
          container query, so the sidebar is accounted for), stacked in the
          same order below that. */}
      <div className="@container mx-auto max-w-352 p-6">
        <h1 className="text-xl font-semibold">Settings</h1>

        <p className="text-muted-foreground mt-2">
          Customize the theme, notifications and how simulations run.
        </p>

        <div className="mt-8 grid items-start gap-8 @5xl:grid-cols-2">
          <section className="flex max-w-2xl flex-col gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">General</h2>
            <ColorSchemeSetting />
            <AppIconSetting />
            <NotifySetting />
            <UpdatesSetting />
          </section>

          <section className="flex max-w-2xl flex-col gap-4">
            <h2 className="text-sm font-medium text-muted-foreground">Simulation</h2>
            <OutputLocationSetting />
            <SimulationTimeoutSetting />
          </section>
        </div>
      </div>
    </div>
  )
}
