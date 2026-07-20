# @atlas/database

Supabase client factory and generated PostgreSQL types.

## Responsibilities

- Typed Supabase client creation (browser + server)
- Re-export generated database types from migrations
- Database query helpers (added in M1+)

## Public API

- `@atlas/database` — client factory and exports
- `@atlas/database/types` — generated `Database` type

## Dependencies

- `@atlas/config` (M0 Phase 8+) — environment variables
- `@supabase/supabase-js` (M0 Phase 8+)

## Does NOT belong here

- Business entity logic (use domain packages)
- RLS policy definitions (live in `supabase/migrations/`)
- Raw SQL in application code without query helpers
