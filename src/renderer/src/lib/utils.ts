import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

// Stopwatch-style M:SS/H:MM:SS, for a live, ticking "Elapsed" counter
// next to a label that already says what it is. As a bare value (e.g.
// a table cell with nothing else around it), 0:39 reads ambiguously:
// use formatRunDuration (lib/run-format.ts) for those spots instead.
export function formatDuration(seconds: number): string {
  const totalSeconds = Math.floor(seconds)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatShortcut(binding: string): string {
  const isMac = navigator.userAgent.includes('Mac')

  const parts = binding.split('+')

  const formatted = parts.map((part) => {
    switch (part) {
      case 'mod':
        return isMac ? '⌘' : 'Ctrl'
      case 'shift':
        return isMac ? '⇧' : 'Shift'
      case 'alt':
        return isMac ? '⌥' : 'Alt'
      case 'enter':
        return isMac ? '↵' : 'Enter'
      case 'backspace':
        return isMac ? '⌫' : 'Backspace'
      case 'delete':
        return isMac ? '⌦' : 'Delete'
      case 'escape':
        return isMac ? '⎋' : 'Esc'
      default:
        return part.length === 1 ? part.toUpperCase() : part
    }
  })

  return isMac ? formatted.join('') : formatted.join('+')
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }

  return new Error(typeof error === 'string' ? error : JSON.stringify(error))
}
