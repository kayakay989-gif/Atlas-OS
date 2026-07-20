# Vercel Deployment — Atlas Sales OS

## Monorepo setup

| Setting | Value |
|---------|-------|
| Root Directory | `apps/web` |
| Framework Preset | Next.js |
| Build Command | `cd ../.. && pnpm build --filter=@atlas/web` |
| Install Command | `cd ../.. && pnpm install` |
| Output Directory | `.next` (default) |

Alternatively, connect the repository root and set the root directory to `apps/web` in the Vercel dashboard — Vercel detects Next.js automatically.

## Environment variables

### Preview

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_APP_URL` | Vercel preview URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

### Production

Same keys with production Supabase project values. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the web app — server-only when needed in M1+.

## Feature flags

Set `FF_*` variables in Vercel per environment. Defaults are safe (disabled) when unset.

## Preview checklist

- [ ] `/` renders foundation shell
- [ ] `/health` returns `{ "status": "ok" }`
- [ ] No console errors on load
- [ ] Security headers present (see [security-headers.md](./security-headers.md))
