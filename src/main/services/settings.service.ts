import { existsSync, readFileSync, writeFileSync } from 'fs'
import { getSettingsPath } from './filesystem/app-paths'

class SettingsService {
  private settingsPath?: string

  private get path(): string {
    if (!this.settingsPath) {
      this.settingsPath = getSettingsPath()
    }

    return this.settingsPath
  }

  get<T>(key: string, defaultValue: T): T {
    const settings = this.load()

    return settings[key] ?? defaultValue
  }

  set(key: string, value: unknown): void {
    const settings = this.load()

    settings[key] = value

    writeFileSync(this.path, JSON.stringify(settings, null, 2))
  }

  private load(): Record<string, any> {
    if (!existsSync(this.path)) {
      return {}
    }

    try {
      return JSON.parse(readFileSync(this.path, 'utf-8'))
    } catch {
      return {}
    }
  }
}

export const settingsService = new SettingsService()
