import { type ReactElement } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { AppSidebar } from '@/layouts/app-sidebar'
import { AppHeader } from '@/layouts/app-header'
import { AppBanner } from '@/layouts/app-banner'

export function AppLayout({ children }: { children: React.ReactNode }): ReactElement {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="flex h-screen flex-col">
        <AppHeader />

        <AppBanner />

        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
