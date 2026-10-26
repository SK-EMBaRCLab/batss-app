// Kept free of Electron imports so it can be tested on its own

/**
 * Whether `url` is the app's own page: the dev server's origin in
 * development, otherwise the bundled index.html. Compared decoded (spaces
 * can arrive as %20 or not), and case-insensitively on Windows, where
 * drive letters and folder names may differ in case. A mismatch here
 * would refuse every request, so it errs toward tolerant comparison.
 */
export function matchesAppPage(
  url: string,
  rendererFileUrl: string,
  devUrl: string | undefined,
  windows = process.platform === 'win32'
): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (devUrl) return parsed.origin === new URL(devUrl).origin

  if (parsed.protocol !== 'file:') return false
  const normalise = (fileUrl: string): string => {
    const decoded = decodeURIComponent(new URL(fileUrl).pathname)
    return windows ? decoded.toLowerCase() : decoded
  }
  return normalise(url) === normalise(rendererFileUrl)
}
