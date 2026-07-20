# Runbook: High Bounce Rate

**Alert key:** `bounce_rate_high`  
**Severity:** Warning

## Symptoms

- Operations dashboard shows bounce rate ≥ 5% on active campaigns
- Campaign sends succeed but bounces_count rises quickly

## Immediate actions

1. **Pause active campaigns** from `/campaigns/[id]`
2. Review recent send lists for stale or purchased contacts
3. Check `/deliverability/suppression` for new hard bounces
4. Verify SPF/DKIM/DMARC on `/deliverability/domains`

## Resolution

- Remove bad contacts from campaigns
- Re-verify domain DNS
- Resume campaigns at reduced volume after 24h clean sends

## Prevention

- Keep qualification threshold high (`min_qualification_score`)
- Never send to unverified contacts
