import { createServerSupabaseClient, getSupabaseConfigFromEnv } from '@atlas/database'

/** Service-role client for trusted server-side background work (public booking follow-up). */
export function createServiceClient() {
  const config = getSupabaseConfigFromEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for meeting follow-up jobs')
  }

  return createServerSupabaseClient({
    url: config.url,
    anonKey: config.anonKey,
    serviceRoleKey: config.serviceRoleKey,
  })
}
