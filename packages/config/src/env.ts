import { z } from 'zod'

const nodeEnvSchema = z.enum(['development', 'test', 'production']).default('development')

/** Server-side environment variables (validated at runtime, not import time). */
export const serverEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  TRIGGER_SECRET_KEY: z.string().min(1).optional(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

/** Keys required when running the full stack locally or in production. */
export const REQUIRED_SERVER_ENV_KEYS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const satisfies readonly (keyof ServerEnv)[]

export interface GetServerEnvOptions {
  /** When true, fail if required keys for a running deployment are missing. */
  strict?: boolean
}

let cachedServerEnv: ServerEnv | null = null

function formatEnvError(error: z.ZodError): string {
  const details = error.errors.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
  return `Invalid environment configuration: ${details}`
}

function assertRequiredKeys(env: ServerEnv, keys: readonly (keyof ServerEnv)[]): void {
  const missing = keys.filter((key) => env[key] === undefined || env[key] === '')
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

/** Parse and validate server environment variables. Throws on invalid values. */
export function getServerEnv(options: GetServerEnvOptions = {}): ServerEnv {
  if (cachedServerEnv && !options.strict) {
    return cachedServerEnv
  }

  const result = serverEnvSchema.safeParse(process.env)
  if (!result.success) {
    throw new Error(formatEnvError(result.error))
  }

  if (options.strict) {
    assertRequiredKeys(result.data, REQUIRED_SERVER_ENV_KEYS)
  }

  cachedServerEnv = result.data
  return result.data
}

/** @internal Test helper */
export function resetServerEnvCache(): void {
  cachedServerEnv = null
}

/** Alias for getServerEnv — plan/documentation compatibility. */
export const getEnv = getServerEnv
