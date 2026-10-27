// macOS updates without Squirrel.Mac. Releases aren't signed with an
// Apple Developer ID, so Squirrel.Mac refuses to install them ("Restart &
// Install" fails). Instead the release's .dmg is downloaded to the
// Downloads folder, checked against the hash in latest-mac.yml and opened
// in Finder, where the user drags Albatross into Applications.
import { createHash } from 'crypto'
import { app, net, shell } from 'electron'
import { createWriteStream } from 'fs'
import { rename, rm } from 'fs/promises'
import { join } from 'path'
import { Readable, Transform } from 'stream'
import { pipeline } from 'stream/promises'
import type { ReadableStream as NodeReadableStream } from 'stream/web'

// Same repository as `publish` in electron-builder.yml
const RELEASE_DOWNLOAD_URL = 'https://github.com/SK-EMBaRCLab/batss-app/releases/download'

/** The parts of latest-mac.yml (electron-updater's UpdateInfo) used here. */
export type ReleaseInfo = {
  version: string
  files: readonly { url: string; sha512: string; size?: number }[]
}

export type DiskImage = { fileName: string; url: string; sha512: string; size?: number }

/** The release's .dmg and where to download it, or null if it has none. */
export function findDiskImage(info: ReleaseInfo): DiskImage | null {
  const file = info.files.find((candidate) => candidate.url.endsWith('.dmg'))
  if (!file) return null

  // A bare file name in latest-mac.yml; anything else isn't ours to fetch
  if (!/^[\w.-]+\.dmg$/.test(file.url)) return null

  return {
    fileName: file.url,
    url: `${RELEASE_DOWNLOAD_URL}/v${encodeURIComponent(info.version)}/${file.url}`,
    sha512: file.sha512,
    size: file.size
  }
}

/**
 * Downloads `image` to the Downloads folder and returns its path. Throws
 * if the download fails or doesn't match the published hash, leaving no
 * file behind. An earlier download of the same version is replaced.
 */
export async function downloadDiskImage(
  image: DiskImage,
  onProgress: (percent: number) => void
): Promise<string> {
  const response = await net.fetch(image.url)
  if (!response.ok || !response.body) throw new Error(`Download failed: HTTP ${response.status}`)

  const total = image.size ?? Number(response.headers.get('content-length'))
  const destination = join(app.getPath('downloads'), image.fileName)
  const partial = `${destination}.part`

  const hash = createHash('sha512')
  let received = 0
  const track = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      hash.update(chunk)
      received += chunk.length
      if (total > 0) onProgress(Math.min(100, (received / total) * 100))
      callback(null, chunk)
    }
  })

  try {
    // Electron's fetch gives the browser's stream type; Node's is the same at run time
    await pipeline(
      Readable.fromWeb(response.body as NodeReadableStream),
      track,
      createWriteStream(partial)
    )

    // latest-mac.yml gives the hash in base64
    if (hash.digest('base64') !== image.sha512) {
      throw new Error("The downloaded update doesn't match the hash published with the release")
    }
    await rename(partial, destination)
  } catch (error) {
    await rm(partial, { force: true })
    throw error
  }

  return destination
}

/** Opens the disk image (Finder shows Albatross next to Applications), or shows it in Finder if that fails. */
export async function openDiskImage(path: string): Promise<void> {
  const problem = await shell.openPath(path)
  if (problem) shell.showItemInFolder(path)
}
