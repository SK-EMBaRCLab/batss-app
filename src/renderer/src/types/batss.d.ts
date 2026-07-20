export {}

declare global {
  interface Window {
    batss: {
      runExample(): Promise<{
        status: string
        package: string
        functions: number
      }>
    }
  }
}
