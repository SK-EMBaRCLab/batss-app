import { app, nativeTheme } from 'electron'

import brandIcon from '../../../resources/icon.png?asset'
import darkIcon from '../../../resources/icon-dark.png?asset'
import lightIcon from '../../../resources/icon-light.png?asset'
import type { AppearanceState, IconAppearance } from '../../shared/appearance-types'
import { isIconAppearance, isThemeSource, resolveIconVariant } from '../../shared/appearance-types'
import { IPC } from '../../shared/ipc-channels'
import { settingsService } from '../services/settings.service'
import { broadcast } from './safe-send'
import { handle } from './trusted-ipc'

const iconPaths = { brand: brandIcon, light: lightIcon, dark: darkIcon }
let iconAppearance: IconAppearance = 'theme'

function currentTheme(): AppearanceState {
  return {
    source: nativeTheme.themeSource,
    dark: nativeTheme.shouldUseDarkColors,
    iconAppearance
  }
}

function publishAppearance(): AppearanceState {
  const payload = currentTheme()

  if (process.platform === 'darwin') {
    app.dock?.setIcon(iconPaths[resolveIconVariant(iconAppearance, payload.dark)])
  }

  broadcast(IPC.theme.updated, payload)

  return payload
}

export function registerThemeIPC(): void {
  const savedIcon = settingsService.get<unknown>('iconAppearance', 'theme')
  iconAppearance = isIconAppearance(savedIcon) ? savedIcon : 'theme'
  const savedTheme = settingsService.get<unknown>('themeSource', 'system')
  nativeTheme.themeSource = isThemeSource(savedTheme) ? savedTheme : 'system'

  handle(IPC.theme.get, () => currentTheme())

  handle(IPC.theme.set, (_event, theme: unknown) => {
    if (!isThemeSource(theme)) throw new Error('Invalid theme.')

    settingsService.set('themeSource', theme)
    nativeTheme.themeSource = theme
    // Publish explicitly even if the effective light/dark appearance did not change.
    return publishAppearance()
  })

  handle(IPC.theme.setIconAppearance, (_event, choice: unknown) => {
    if (!isIconAppearance(choice)) throw new Error('Invalid icon appearance.')

    settingsService.set('iconAppearance', choice)
    iconAppearance = choice
    return publishAppearance()
  })

  // Also follows OS changes when the app is using the System color scheme.
  nativeTheme.on('updated', publishAppearance)
  publishAppearance()
}
