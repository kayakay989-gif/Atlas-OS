$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host '==> Atlas Sales OS — developer bootstrap'

$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
  Write-Error 'Node.js 20+ is required.'
}

$major = [int]($nodeVersion -replace '^v(\d+)\..*', '$1')
if ($major -lt 20) {
  Write-Error "Node.js 20+ required (found $nodeVersion)."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Host 'pnpm not found — using npx pnpm@9.15.4'
  $pnpm = 'npx pnpm@9.15.4'
} else {
  $pnpm = 'pnpm'
}

if (-not (Test-Path '.env.local')) {
  Copy-Item '.env.example' '.env.local'
  Write-Host 'Created .env.local from .env.example'
}

Invoke-Expression "$pnpm install"

Write-Host ''
Write-Host 'Bootstrap complete.'
Write-Host ''
Write-Host 'Next steps:'
Write-Host '  1. Start Supabase (requires Docker):  pnpm supabase:start'
Write-Host '  2. Run web app:                       pnpm --filter @atlas/web dev'
Write-Host '  3. Run worker (optional):             pnpm --filter @atlas/worker dev'
Write-Host '  4. Validate workspace:                pnpm validate'
Write-Host ''
