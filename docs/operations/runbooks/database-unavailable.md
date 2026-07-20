# Runbook: Database Unavailable

**Health check:** `database` status `error`

## Symptoms

- `/health` returns 503
- Dashboard pages fail to load data
- Supabase connection errors in logs

## Immediate actions

1. Check [Supabase status](https://status.supabase.com/)
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and keys in Vercel/host env
3. Confirm project is not paused (free tier inactivity)

## Resolution

- Restore Supabase project if paused
- Rotate keys if compromised
- Run `pnpm db:reset` locally to verify migrations

## Recovery verification

- `/health` returns `{ "status": "ok" }`
- Login and dashboard load under 3s
