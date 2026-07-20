import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfigFromEnv } from '@atlas/database'
import { runDeepHealthCheck } from '@atlas/ops'
import { NextResponse } from 'next/server'

/** Deep health check for deploy smoke tests and uptime monitoring. */
export async function GET() {
  const config = getSupabaseConfigFromEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  const client =
    config.url && config.anonKey
      ? createClient(config.url, config.anonKey, { auth: { persistSession: false } })
      : null

  const result = await runDeepHealthCheck(client, {
    supabaseUrl: config.url,
    supabaseAnonKey: config.anonKey,
    supabaseServiceRoleKey: config.serviceRoleKey,
  })

  const statusCode = result.status === 'error' ? 503 : 200

  return NextResponse.json(result, {
    status: statusCode,
    headers: { 'Cache-Control': 'no-store' },
  })
}
