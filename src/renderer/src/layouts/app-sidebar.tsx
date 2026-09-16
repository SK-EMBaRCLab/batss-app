import { type ReactElement } from 'react'

import electronLogo from '@/assets/electron.svg'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { navigationItems } from '@/config/navigation'
import { useDesign } from '@/stores/design'
import { useNavigation } from '@/stores/navigation'

export function AppSidebar(): ReactElement {
  const currentView = useNavigation((state) => state.currentView)
  const navigate = useNavigation((state) => state.navigate)
  const isRunning = useDesign((s) => s.isRunning)

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Albatross">
              <img
                src={electronLogo}
                alt="Albatross"
                className="size-12 rounded-lg object-contain"
              />

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-extrabold font-mono uppercase">Albatross</span>
                <span className="truncate text-xs font-extralight">ABC-INLA</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={currentView === item.view}
                    onClick={() => navigate(item.view)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          {isRunning && (
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Simulation running">
                <Spinner />
                <span>Running</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
