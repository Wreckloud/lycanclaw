const isDev = import.meta.env.DEV

function withScope(scope: string, message: string): string {
  return `[${scope}] ${message}`
}

export function logDebug(scope: string, message: string, ...args: unknown[]): void {
  if (!isDev) return
  console.debug(withScope(scope, message), ...args)
}

export function logError(scope: string, message: string, ...args: unknown[]): void {
  console.error(withScope(scope, message), ...args)
}
