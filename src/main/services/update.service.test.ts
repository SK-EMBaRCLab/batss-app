import { beforeEach, describe, expect, test, vi } from 'vitest'

// electron-updater skips the check outside a packaged app and resolves
// with null, sending no events (see AppUpdater.isUpdaterActive)
const checkForUpdates = vi.hoisted(() => vi.fn())
vi.mock('electron-updater', () => ({ autoUpdater: { checkForUpdates, on: vi.fn() } }))
vi.mock('electron', () => ({ app: {}, net: {}, shell: {} }))
vi.mock('./error-log.service', () => ({ recordError: vi.fn(() => 'REF-0000') }))

const { DEV_BUILD_MESSAGE, updateService } = await import('./update.service')

beforeEach(() => {
  checkForUpdates.mockReset()
})

describe('UpdateService.check', () => {
  test('in a development build, ends idle and says why instead of staying on checking', async () => {
    checkForUpdates.mockResolvedValue(null)
    await updateService.check()
    expect(updateService.get()).toEqual({
      status: 'idle',
      message: DEV_BUILD_MESSAGE,
      silent: false
    })
  })

  test('the launch check is marked silent, so nothing is shown', async () => {
    checkForUpdates.mockResolvedValue(null)
    await updateService.check(true)
    expect(updateService.get()).toMatchObject({ status: 'idle', silent: true })
  })

  test("leaves the outcome to the updater's events when the check runs", async () => {
    checkForUpdates.mockResolvedValue({ updateInfo: { version: '9.9.9' } })
    await updateService.check()
    expect(updateService.get().status).toBe('checking')
  })
})
