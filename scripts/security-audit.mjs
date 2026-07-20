#!/usr/bin/env node
/**
 * Security audit helper — dependency scan + RLS inventory checklist.
 * Run: node scripts/security-audit.mjs
 */
import { execSync } from 'node:child_process'

const RLS_PROTECTED_TABLES = [
  'organizations',
  'memberships',
  'companies',
  'contacts',
  'campaigns',
  'send_records',
  'mailboxes',
  'outreach_domains',
  'proposals',
  'invoices',
  'system_alerts',
  'usage_events',
]

console.log('Atlas Sales OS — Security Audit\n')

console.log('## Dependency audit (npm audit --audit-level=high)')
try {
  execSync('npm audit --audit-level=high --json', { stdio: 'pipe', encoding: 'utf8' })
  console.log('No high/critical npm vulnerabilities reported.\n')
} catch (error) {
  const output = error instanceof Error && 'stdout' in error ? String(error.stdout) : ''
  if (output) {
    try {
      const parsed = JSON.parse(output)
      const meta = parsed.metadata?.vulnerabilities ?? {}
      console.log(`Vulnerabilities — critical: ${meta.critical ?? 0}, high: ${meta.high ?? 0}`)
      console.log('Review npm audit output and patch before production deploy.\n')
    } catch {
      console.log('npm audit reported issues. Run `npm audit` locally for details.\n')
    }
  } else {
    console.log('npm audit unavailable or failed. Run `npm audit` manually.\n')
  }
}

console.log('## RLS-protected tables (verify policies in Supabase dashboard)')
for (const table of RLS_PROTECTED_TABLES) {
  console.log(`- ${table} (RLS required: yes)`)
}

console.log('\n## Manual checklist')
console.log('- [ ] Confirm SUPABASE_SERVICE_ROLE_KEY is server-only')
console.log('- [ ] Confirm RLS enabled on all tenant tables in staging')
console.log('- [ ] Rotate API keys if any were exposed in logs')
console.log('- [ ] Review audit_logs for anomalous admin actions')
