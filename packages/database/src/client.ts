import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

export interface SupabaseClientConfig {
  url: string
  anonKey: string
}

/** Browser-safe Supabase client (uses anon key + RLS). */
export function createBrowserSupabaseClient(config: SupabaseClientConfig): SupabaseClient<Database> {
  return createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
}

/** Server-side Supabase client factory (service role or anon depending on caller). */
export function createServerSupabaseClient(
  config: SupabaseClientConfig & { serviceRoleKey?: string },
): SupabaseClient<Database> {
  const key = config.serviceRoleKey ?? config.anonKey
  return createClient<Database>(config.url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/** Resolve Supabase config from validated environment variables. */
export function getSupabaseConfigFromEnv(env: {
  NEXT_PUBLIC_SUPABASE_URL?: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}): SupabaseClientConfig & { serviceRoleKey?: string } {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}
