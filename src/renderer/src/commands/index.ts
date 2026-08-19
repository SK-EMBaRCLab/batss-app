import { AppCommand } from '@/types/command'

import { appCommands } from './app.commands'
import { designCommands } from './design'
import { navigationCommands } from './navigation'

export const commands: AppCommand[] = [...appCommands, ...designCommands, ...navigationCommands]
