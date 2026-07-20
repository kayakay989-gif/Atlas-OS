# Environment Setup — Atlas Sales OS

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-07-19

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS | Runtime |
| pnpm | 9+ | Package manager |
| Docker Desktop | Latest | Supabase local development |
| Supabase CLI | Latest | Database migrations |
| Git | Latest | Version control |

Optional (for worker development):

| Tool | Purpose |
|------|---------|
| Trigger.dev account | Background job orchestration |

Install Supabase CLI:

```bash
npm install -g supabase
```

---

## Initial Setup

**Windows (PowerShell):**

```powershell
./scripts/bootstrap.ps1
```

**macOS / Linux:**

```bash
chmod +x scripts/bootstrap.sh
./scripts/bootstrap.sh
```

**Manual setup:**

```bash
# Clone the repository
git clone <repository-url>
cd Atlas-Sales-OS

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Start Supabase locally (requires Docker)
pnpm supabase:start

# Apply migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

The web app runs at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | M0 | App URL (`http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | M1 | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | M1 | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | M1 | Supabase service role key (server only) |
| `TRIGGER_SECRET_KEY` | M0 (worker) | Trigger.dev secret key |
| `OPENAI_API_KEY` | M2 | OpenAI API key |
| `GEMINI_API_KEY` | M2 | Google Gemini API key |
| `RESEND_API_KEY` | M4 | Resend transactional email |
| `FIRECRAWL_API_KEY` | M2 | Firecrawl web extraction |

After `pnpm supabase:start`, copy the anon and service role keys from the CLI output into `.env.local`.

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm format` | Format code with Prettier |
| `pnpm supabase:start` | Start local Supabase |
| `pnpm supabase:stop` | Stop local Supabase |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:reset` | Reset local database |
| `pnpm db:types` | Generate TypeScript types from schema |

### Run Individual Apps

```bash
# Web app only
pnpm --filter @atlas/web dev

# Worker only (requires Trigger.dev CLI and TRIGGER_SECRET_KEY)
pnpm --filter @atlas/worker dev
```

---

## Monorepo Structure

```
apps/web       → Next.js dashboard (@atlas/web)
apps/worker    → Trigger.dev worker (@atlas/worker)
packages/jobs  → Job abstraction (@atlas/jobs) — no Trigger.dev imports here
packages/*     → Shared libraries
supabase/      → Migrations and config
```

**Rule:** Only `apps/worker/src/adapters/trigger.ts` may import `@trigger.dev/sdk`.

---

## Trigger.dev Setup

1. Create a project at [trigger.dev](https://trigger.dev)
2. Copy the dev secret key to `TRIGGER_SECRET_KEY` in `.env.local`
3. Update `project` in `apps/worker/trigger.config.ts` with your project ID
4. Run `pnpm --filter @atlas/worker dev`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `pnpm install` fails | Ensure Node 20+ and pnpm 9+ are installed |
| Supabase won't start | Ensure Docker Desktop is running |
| Port 3000 in use | Stop other processes or change Next.js port |
| Worker can't connect | Verify `TRIGGER_SECRET_KEY` and project ID |

---

## Related Documents

- [Development Workflow](./workflow.md)
- [PROJECT_STATE.md](../../PROJECT_STATE.md)
- [Milestone Plan](../milestones/milestone-plan.md)
