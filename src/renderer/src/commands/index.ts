import { AppCommand } from '@/types/command'

import { appCommands } from './app.commands'
import { designCommands } from './design'
import { navigationCommands } from './navigation'
import { updateCommands } from './update'

export const commands: AppCommand[] = [
  ...appCommands,
  ...designCommands,
  ...navigationCommands,
  ...updateCommands
]
