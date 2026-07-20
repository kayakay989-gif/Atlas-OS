# Disaster Recovery — Atlas Sales OS

**Version:** 1.0  
**Last Updated:** 2026-07-20

---

## Backup strategy

| Component             | Backup method                                | RPO                        | RTO           |
| --------------------- | -------------------------------------------- | -------------------------- | ------------- |
| PostgreSQL (Supabase) | Managed daily backups + PITR (Pro plan)      | 24h (Free) / minutes (Pro) | 1–4 hours     |
| Auth users            | Supabase Auth export                         | Daily                      | 1 hour        |
| Application code      | Git (`main` on GitHub)                       | 0 (every merge)            | 30 min deploy |
| Secrets               | Vercel/Trigger env vars (documented offline) | Manual                     | 1 hour        |

---

## Recovery procedures

### Database restore

1. Open Supabase dashboard → **Database → Backups**
2. Select restore point or use PITR on Pro
3. Restore to a **new** project for validation before cutover
4. Update env vars (`NEXT_PUBLIC_SUPABASE_URL`, keys) in Vercel and Trigger.dev
5. Run smoke tests: `/health`, login, `/dashboard`

### Full platform rebuild

1. Clone repo and checkout tagged release (`v0.9.0`)
2. Create fresh Supabase project
3. Run `pnpm db:reset` equivalent migrations via CI
4. Redeploy Vercel + Trigger.dev worker
5. Re-seed org data or restore from backup export

---

## Testing

- **Quarterly:** Verify backup exists in Supabase dashboard
- **After M9:** Run `node scripts/load-test.mjs` against staging
- **Before production:** Run `node scripts/security-audit.mjs`

---

## Contacts

Document your on-call rotation and Supabase support tier here before go-live.
