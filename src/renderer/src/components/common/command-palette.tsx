import { FolderClock } from 'lucide-react'
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
import { useRecentDesigns } from '@/hooks/use-recent-designs'
import { formatShortcut } from '@/lib/utils'
import { useCommandPalette } from '@/stores/command-palette'
import { useDesign } from '@/stores/design'

export function CommandPalette(): ReactElement {
  const open = useCommandPalette((state) => state.open)
  const setOpen = useCommandPalette((state) => state.setOpen)

  const loadDesign = useDesign((state) => state.loadDesign)

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
                      if (!enabled) return

                      // Close first — otherwise the dialog's backdrop
                      // (re-mounted fresh each time it opens) ends up
                      // stacked above feedback like toasts that the
                      // command triggers, hiding them until the
                      // palette is closed.
                      setOpen(false)
                      command.action()
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

          {/* Read when the palette opens, so it's current */}
          {open && (
            <RecentDesignCommands
              onOpen={(id) => {
                setOpen(false)
                void loadDesign(id)
              }}
            />
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

// "Open recent: …" for each recent design that's still where it was
function RecentDesignCommands({ onOpen }: { onOpen: (id: string) => void }): ReactElement | null {
  const { recent } = useRecentDesigns()
  const found = recent.filter((item) => item.found)
  if (found.length === 0) return null

  return (
    <CommandGroup heading="Recent designs">
      {found.map((item) => (
        <CommandItem
          key={item.id}
          value={`Open recent ${item.name} ${item.id}`}
          onSelect={() => onOpen(item.id)}
        >
          <FolderClock className="mr-2 h-4 w-4" />
          Open recent: {item.name}
        </CommandItem>
      ))}
    </CommandGroup>
  )
}
