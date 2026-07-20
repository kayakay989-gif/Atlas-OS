/** Parse JSON safely; returns null on invalid input instead of throwing. */
export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}
