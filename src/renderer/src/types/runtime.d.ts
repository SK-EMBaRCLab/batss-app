export {}

declare global {
  interface Window {
    runtime: {
      check(): Promise<void>
    }
  }
}
