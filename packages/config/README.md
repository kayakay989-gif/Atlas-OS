# @atlas/config

Environment validation, feature flags, and shared tooling configuration.

## Responsibilities

- Zod-validated environment variables (`getServerEnv()`)
- Feature flag definitions and evaluation (ADR-0012)
- Shared ESLint, Prettier, Tailwind, and Vitest presets

## Public API

- `getServerEnv({ strict?: boolean })` — parse `process.env`; strict mode requires Supabase + app URL keys
- `getFeatureFlags(context?)` — resolve flags from env overrides and safe defaults
- `isFeatureEnabled(flag, context?)` — single-flag check at module boundaries
- `@atlas/config/eslint/base` — shared ESLint flat config
- `@atlas/config/prettier` — shared Prettier config

## Dependencies

- `zod` — environment schema validation

## Does NOT belong here

- Business domain constants (use `@atlas/shared`)
- Database connection logic (use `@atlas/database`)
- Secrets or `.env` files (never commit; document in `.env.example` only)
