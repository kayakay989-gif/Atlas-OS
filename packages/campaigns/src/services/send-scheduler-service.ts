export interface SendWindow {
  timezone: string
  sendWindowStart: string
  sendWindowEnd: string
}

export function isWithinSendWindow(window: SendWindow, now = new Date()): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: window.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00'
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00'
  const current = `${hour}:${minute}`

  return current >= window.sendWindowStart && current <= window.sendWindowEnd
}

export function computeNextSendAt(delayDays: number, from = new Date()): Date {
  const next = new Date(from)
  next.setUTCDate(next.getUTCDate() + delayDays)
  return next
}
