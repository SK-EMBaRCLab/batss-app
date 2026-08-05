import { AppCommand } from '@/types/command'
import { designCommands } from './design'
import { navigationCommands } from './navigation'
import { appCommands } from './app.commands'

export const commands: AppCommand[] = [...appCommands, ...designCommands, ...navigationCommands]
