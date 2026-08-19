import { type ReactElement } from 'react'

import { commands } from '@/commands'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut
} from '@/components/ui/command'
import { formatShortcut } from '@/lib/utils'
import { useCommandPalette } from '@/stores/command-palette'

export function CommandPalette(): ReactElement {
  const open = useCommandPalette((state) => state.open)
  const setOpen = useCommandPalette((state) => state.setOpen)

  const groupedCommands = Object.groupBy(
    commands.filter((command) => command.showInPalette),
    (cmd) => cmd.group
  )

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Type a command..." />

        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {Object.entries(groupedCommands).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items?.map((command) => {
                const Icon = command.icon
                const enabled = !command.enabled || command.enabled()

                return (
                  <CommandItem
                    key={command.id}
                    disabled={!enabled}
                    onSelect={() => {
                      if (enabled) {
                        command.action()
                      }
                    }}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4" />}

                    {command.label}

                    {command.shortcut && (
                      <CommandShortcut>{formatShortcut(command.shortcut.binding)}</CommandShortcut>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
