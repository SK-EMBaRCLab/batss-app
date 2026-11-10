import { type ReactElement } from 'react'

import { RunProgressPanel } from '@/components/common/run-progress-panel'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppBanner } from '@/layouts/app-banner'
import { AppHeader } from '@/layouts/app-header'
import { AppSidebar } from '@/layouts/app-sidebar'
import { UpdateBanner } from '@/layouts/update-banner'

export function AppLayout({ children }: { children: React.ReactNode }): ReactElement {
  return (
    // The window's height is set once, on the outer row. The main area
    // fills what's left of it (min-h-0) rather than taking the window's
    // height itself, so a sidebar variant that adds margins around it
    // (inset adds 8px a side) doesn't make the page taller than the window
    <SidebarProvider className="h-svh">
      <AppSidebar />

      <SidebarInset className="flex min-h-0 min-w-0 flex-col">
        <AppHeader />

        <AppBanner />
        <UpdateBanner />

        <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <TooltipProvider>{children}</TooltipProvider>
        </main>
      </SidebarInset>
      <RunProgressPanel />
      <Toaster />
    </SidebarProvider>
  )
}
