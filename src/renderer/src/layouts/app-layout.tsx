import { JSX } from 'react'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { AppSidebar } from '@/components/app-sidebar'
import { AppHeader } from '@/components/app-header'

export function AppLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="flex h-screen flex-col">
        <AppHeader />

        <main className="min-h-0 flex-1 overflow-hidden p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
