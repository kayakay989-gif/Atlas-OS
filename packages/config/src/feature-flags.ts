/**
 * Feature flag registry — safe defaults keep incomplete modules off in production.
 * See ADR-0012.
 */

/** Canonical flag names; extend as milestones ship modules. */
export const FEATURE_FLAG_NAMES = {
  discoveryPipeline: 'discoveryPipeline',
  outreachGeneration: 'outreachGeneration',
  emailSending: 'emailSending',
  campaignExecution: 'campaignExecution',
  meetingBooking: 'meetingBooking',
  crmModule: 'crmModule',
  aiAgents: 'aiAgents',
} as const

export type FeatureFlagName = keyof typeof FEATURE_FLAG_NAMES

export type FeatureFlags = Record<FeatureFlagName, boolean>

/** Safe defaults: incomplete capabilities stay disabled until milestone sign-off. */
export const FEATURE_FLAG_DEFAULTS: FeatureFlags = {
  discoveryPipeline: false,
  outreachGeneration: false,
  emailSending: false,
  campaignExecution: false,
  meetingBooking: false,
  crmModule: false,
  aiAgents: false,
}

/** Maps flag names to environment variable keys (FF_DISCOVERY_PIPELINE, etc.). */
export const FEATURE_FLAG_ENV_KEYS: Record<FeatureFlagName, string> = {
  discoveryPipeline: 'FF_DISCOVERY_PIPELINE',
  outreachGeneration: 'FF_OUTREACH_GENERATION',
  emailSending: 'FF_EMAIL_SENDING',
  campaignExecution: 'FF_CAMPAIGN_EXECUTION',
  meetingBooking: 'FF_MEETING_BOOKING',
  crmModule: 'FF_CRM_MODULE',
  aiAgents: 'FF_AI_AGENTS',
}

export interface FeatureFlagContext {
  /** Per-organization overrides from database — wired in M1+. */
  organizationId?: string
  /** Explicit overrides (tests, admin tooling). */
  overrides?: Partial<FeatureFlags>
}

function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue
  }
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1') {
    return true
  }
  if (normalized === 'false' || normalized === '0') {
    return false
  }
  return defaultValue
}

function resolveFlagsFromEnv(): FeatureFlags {
  const env = process.env
  return (Object.keys(FEATURE_FLAG_DEFAULTS) as FeatureFlagName[]).reduce<FeatureFlags>(
    (flags, name) => {
      const envKey = FEATURE_FLAG_ENV_KEYS[name]
      flags[name] = parseEnvBoolean(env[envKey], FEATURE_FLAG_DEFAULTS[name])
      return flags
    },
    { ...FEATURE_FLAG_DEFAULTS },
  )
}

/**
 * Resolve feature flags for the current process.
 * Priority: explicit overrides → environment variables → safe defaults.
 * Database per-org overrides added in M1.
 */
export function getFeatureFlags(context: FeatureFlagContext = {}): FeatureFlags {
  const fromEnv = resolveFlagsFromEnv()

  if (context.overrides) {
    return { ...fromEnv, ...context.overrides }
  }

  // M1+: merge organization_settings when organizationId is provided
  void context.organizationId

  return fromEnv
}

/** Check a single flag (convenience for module boundaries). */
export function isFeatureEnabled(flag: FeatureFlagName, context: FeatureFlagContext = {}): boolean {
  return getFeatureFlags(context)[flag]
}
