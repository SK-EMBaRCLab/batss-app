import { useEffect } from 'react'

import { commands } from '@/commands'

function eventToShortcut(event: KeyboardEvent): string {
  const parts: string[] = []

  if (event.ctrlKey || event.metaKey) {
    parts.push('mod')
  }

  if (event.shiftKey) {
    parts.push('shift')
  }

  if (event.altKey) {
    parts.push('alt')
  }

  const key = event.key.toLowerCase()

  if (['control', 'meta', 'shift', 'alt'].includes(key)) {
    return ''
  }

  parts.push(key)

  return parts.join('+')
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  )
}

export function useCommandShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      // Ignore normal typing immediately.
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        return
      }

      const shortcut = eventToShortcut(event)

      if (!shortcut) {
        return
      }

      const command = commands.find((command) => command.shortcut?.binding === shortcut)

      if (!command) {
        return
      }

      // Ignore shortcuts in editable fields unless they use the mod key.
      if (isEditable(event.target) && !shortcut.startsWith('mod+')) {
        return
      }

      if (command.enabled && !command.enabled()) {
        return
      }

      event.preventDefault()
      void command.action()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}
