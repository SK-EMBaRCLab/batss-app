import { resolveIconVariant } from '@shared/appearance-types'
import { type ReactElement } from 'react'

import brandIcon from '@/assets/batss-studio-brand.svg'
import darkIcon from '@/assets/batss-studio-dark.svg'
import lightIcon from '@/assets/batss-studio-light.svg'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar'
import { navigationItems } from '@/config/navigation'
import { useNavigation } from '@/stores/navigation'
import { useTheme } from '@/stores/theme'

export function AppSidebar(): ReactElement {
  const currentView = useNavigation((state) => state.currentView)
  const navigate = useNavigation((state) => state.navigate)
  const isDark = useTheme((state) => state.isDark)
  const iconAppearance = useTheme((state) => state.iconAppearance)
  const icon = { brand: brandIcon, light: lightIcon, dark: darkIcon }[
    resolveIconVariant(iconAppearance, isDark)
  ]

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Logo goes home, the usual pattern for an app's mark */}
            <SidebarMenuButton
              size="lg"
              tooltip="Go to Dashboard"
              onClick={() => navigate('dashboard')}
            >
              <img
                src={icon}
                alt="BATSS Studio"
                className="size-10 shrink-0 object-contain group-data-[collapsible=icon]:size-8"
              />

              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-extrabold font-mono uppercase">BATSS Studio</span>
                <span className="truncate text-xs font-extralight">ABC-INLA</span>
              </span>
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
    </Sidebar>
  )
}
