import { NextResponse } from 'next/server'

/** Deploy and CI smoke test — no business logic. */
export function GET() {
  return NextResponse.json({ status: 'ok' })
}
