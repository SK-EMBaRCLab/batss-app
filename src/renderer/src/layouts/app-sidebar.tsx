import { resolveIconVariant } from '@shared/appearance-types'
import { type ReactElement } from 'react'

import albatrossBrand from '@/assets/albatross-brand.svg'
import albatrossDark from '@/assets/albatross-dark.svg'
import albatrossLight from '@/assets/albatross-light.svg'
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
import { useEngine } from '@/stores/engine'
import { useNavigation } from '@/stores/navigation'
import { useTheme } from '@/stores/theme'

export function AppSidebar(): ReactElement {
  const currentView = useNavigation((state) => state.currentView)
  const navigate = useNavigation((state) => state.navigate)
  const busy = useEngine((s) => s.busy)
  const isDark = useTheme((state) => state.isDark)
  const iconAppearance = useTheme((state) => state.iconAppearance)
  const icon = { brand: albatrossBrand, light: albatrossLight, dark: albatrossDark }[
    resolveIconVariant(iconAppearance, isDark)
  ]

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Albatross">
              <img
                src={icon}
                alt="Albatross"
                className="size-10 shrink-0 object-contain group-data-[collapsible=icon]:size-8"
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
                    // The stock active style is the same faint grey as hover;
                    // use a primary tint and primary text so the current
                    // page stands out and doesn't look like a hover
                    className="data-active:bg-sidebar-primary/12 data-active:font-semibold data-active:text-sidebar-primary"
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
          {busy !== 'idle' && (
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={busy === 'batch' ? 'Batch running' : 'Simulation running'}
              >
                <Spinner />
                <span>{busy === 'batch' ? 'Batch running' : 'Simulation running'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
