// localStorage can throw in some sandboxed contexts. Fail open: the
// preference just isn't remembered, rather than the UI crashing.

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Ignore; see above.
  }
}
