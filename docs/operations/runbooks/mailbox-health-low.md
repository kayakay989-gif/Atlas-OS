# Runbook: Mailbox Health Low

**Alert key:** `mailbox_health_low`  
**Severity:** Critical

## Symptoms

- One or more active mailboxes below health score 50
- Campaign auto-pause may trigger

## Immediate actions

1. Pause affected campaigns
2. Open `/deliverability/mailboxes` and identify low-health mailboxes
3. Check bounce and complaint rates on recent sends

## Resolution

- Warm mailboxes per deliverability ramp schedule
- Rotate to healthier mailboxes in campaign settings
- Resolve DNS/domain issues if domain health is also low

## Prevention

- Respect daily send limits during warm-up
- Monitor Operations dashboard weekly
