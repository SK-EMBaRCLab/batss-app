export type ThemeSource = 'system' | 'light' | 'dark'
export type IconAppearance = 'theme' | 'brand' | 'light' | 'dark'
export type IconVariant = Exclude<IconAppearance, 'theme'>

export type AppearanceState = {
  source: ThemeSource
  dark: boolean
  iconAppearance: IconAppearance
}

export function isThemeSource(value: unknown): value is ThemeSource {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function isIconAppearance(value: unknown): value is IconAppearance {
  return value === 'theme' || value === 'brand' || value === 'light' || value === 'dark'
}

export function resolveIconVariant(choice: IconAppearance, dark: boolean): IconVariant {
  return choice === 'theme' ? (dark ? 'dark' : 'light') : choice
}
