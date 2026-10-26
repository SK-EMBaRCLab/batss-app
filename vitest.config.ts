import path from 'node:path'

import { defineConfig } from 'vitest/config'

// Same import aliases as the renderer build (electron.vite.config.ts), so
// tests can import renderer code that uses them
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  }
})
