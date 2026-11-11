import { MENU_COMMAND_IDS, type MenuAction, type MenuState } from '@shared/app-menu'
import { useEffect } from 'react'

import { commands } from '@/commands'
import { useDesign } from '@/stores/design'
import { useEngine } from '@/stores/engine'
import { useNavigation } from '@/stores/navigation'
import { useUpdate } from '@/stores/update'

const commandById = (id: string): (typeof commands)[number] | undefined =>
  commands.find((command) => command.id === id)

// Greyed out in the menu exactly when the command is in the app
function menuState(): MenuState {
  return {
    hasDesign: useDesign.getState().design !== null,
    enabled: Object.fromEntries(
      MENU_COMMAND_IDS.map((id) => {
        const command = commandById(id)
        return [id, !!command && (!command.enabled || command.enabled())]
      })
    ) as MenuState['enabled']
  }
}

function carryOut(action: MenuAction): void {
  switch (action.type) {
    case 'command': {
      const command = commandById(action.id)
      if (command && (!command.enabled || command.enabled())) void command.action()
      return
    }
    case 'navigate':
      useNavigation.getState().navigate(action.view)
      return
    case 'open-recent':
      // As from the welcome screen: unsaved changes are asked about first
      void useDesign.getState().loadDesign(action.id)
      return
  }
}

/**
 * Connects the operating system's menu bar to the app's commands: keeps
 * its items greyed out as in the app, and carries out the ones picked.
 * The menu also handles the keyboard shortcuts (see shared/app-menu.ts).
 */
export function useAppMenu(): void {
  useEffect(() => {
    // The commands' enabled() read these stores, so any change may change the menu
    const report = (): void => window.app.setMenuState(menuState())
    report()
    const unsubscribe = [useDesign, useEngine, useUpdate].map((store) => store.subscribe(report))
    const stopListening = window.app.onMenuAction(carryOut)

    return () => {
      for (const stop of unsubscribe) stop()
      stopListening()
    }
  }, [])
}
