import { existsSync, readFileSync, writeFileSync } from 'fs'

import { getSettingsPath } from './filesystem/app-paths'

class SettingsService {
  private settingsPath?: string
  private cache?: Record<string, unknown>

  private get path(): string {
    if (!this.settingsPath) {
      this.settingsPath = getSettingsPath()
    }

    return this.settingsPath
  }

  get<T>(key: string, defaultValue: T): T {
    const settings = this.load()

    return (settings[key] as T | undefined) ?? defaultValue
  }

  set(key: string, value: unknown): void {
    const settings = this.load()

    settings[key] = value
    this.cache = settings

    writeFileSync(this.path, JSON.stringify(settings, null, 2))
  }

  private load(): Record<string, unknown> {
    if (this.cache) {
      return this.cache
    }

    let settings: Record<string, unknown> = {}

    if (existsSync(this.path)) {
      try {
        settings = JSON.parse(readFileSync(this.path, 'utf-8'))
      } catch {
        settings = {}
      }
    }

    this.cache = settings

    return settings
  }
}

export const settingsService = new SettingsService()
