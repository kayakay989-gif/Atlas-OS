#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Atlas Sales OS — developer bootstrap"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js 20+ is required."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "ERROR: Node.js 20+ required (found $(node -v))."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm not found — using npx pnpm@9.15.4"
  PNPM="npx pnpm@9.15.4"
else
  PNPM="pnpm"
fi

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
fi

$PNPM install

echo ""
echo "Bootstrap complete."
echo ""
echo "Next steps:"
echo "  1. Start Supabase (requires Docker):  pnpm supabase:start"
echo "  2. Run web app:                       pnpm --filter @atlas/web dev"
echo "  3. Run worker (optional):             pnpm --filter @atlas/worker dev"
echo "  4. Validate workspace:                pnpm validate"
echo ""
