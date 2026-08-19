import { type ReactElement } from 'react'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppBanner } from '@/layouts/app-banner'
import { AppHeader } from '@/layouts/app-header'
import { AppSidebar } from '@/layouts/app-sidebar'

export function AppLayout({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="flex min-w-0 h-screen flex-col">
        <AppHeader />

        <AppBanner />

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
