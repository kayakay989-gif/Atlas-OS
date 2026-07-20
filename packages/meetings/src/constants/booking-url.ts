/** Production booking link — Calendly scheduling page. */
export const DEFAULT_BOOKING_URL = 'https://calendly.com/essa-qasim/30min'

/** Returns the booking URL used in outreach and settings (env override supported). */
export function getBookingUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BOOKING_URL?.trim()
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_BOOKING_URL
}
