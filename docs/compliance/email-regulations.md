# Email Regulations — Atlas Sales OS

**Version:** 1.0  
**Status:** Accepted  
**Last Updated:** 2026-07-17

---

## Disclaimer

This document provides **technical guidance** on how Atlas Sales OS supports compliance with common email marketing regulations. It is **not legal advice**. Organizations using Atlas Sales OS are responsible for ensuring their outreach practices comply with applicable laws in their jurisdiction. Consult legal counsel for regulatory compliance.

---

## CAN-SPAM Act (United States)

### Requirements

| Requirement | Detail | Platform Support |
|-------------|--------|------------------|
| No false header information | From, To, Reply-To must be accurate | From address validated against registered mailbox |
| No deceptive subject lines | Subject must reflect email content | AI quality check flags misleading subjects (M3) |
| Identify as advertisement | Email must be identifiable as commercial | Configurable footer disclaimer |
| Include physical address | Valid physical postal address required | Organization settings: physical address injected in footer |
| Opt-out mechanism | Clear, conspicuous unsubscribe mechanism | Unsubscribe link auto-injected in every email |
| Honor opt-outs promptly | Within 10 business days | Immediate suppression on unsubscribe (real-time) |
| Monitor third parties | Sender responsible for compliance partners | Audit logs track all send activity |

### Platform Configuration

```
Organization Settings → Compliance → CAN-SPAM
  ☑ Include physical address in footer
  ☑ Include unsubscribe link (required, cannot disable)
  ☑ Include sender identification
  ☐ Include "advertisement" label (optional)
  Physical address: [configured by operator]
```

---

## GDPR (European Union)

### Applicability to Outbound Sales

GDPR applies when processing personal data of EU residents. Business contact information (name, business email, company role) may constitute personal data.

### Lawful Basis for B2B Outreach

| Basis | Applicability | Platform Support |
|-------|---------------|------------------|
| Legitimate interest | B2B outreach to business contacts | Default for B2B; operator confirms in settings |
| Consent | Required for some jurisdictions/use cases | Consent tracking module |
| Contract | Existing customer relationship | Contact history tracking |

### Key Requirements

| Requirement | Platform Support |
|-------------|------------------|
| Lawful basis documented | Consent records + legitimate interest configuration |
| Data minimization | Only business contact fields stored |
| Purpose limitation | Data used only for configured outreach |
| Storage limitation | Configurable retention periods |
| Right to access | Contact data export (JSON/CSV) |
| Right to erasure | Contact deletion (suppression persists) |
| Right to object | Unsubscribe = objection to processing |
| Data breach notification | Audit logs enable breach assessment |
| Records of processing | Audit logs serve as processing records |

### Platform Configuration

```
Organization Settings → Compliance → GDPR
  Lawful basis: [Legitimate Interest / Consent / Both]
  ☑ Require consent before first outreach (strict mode)
  Data retention period: [12 months default]
  ☑ Enable data export
  ☑ Enable deletion requests
  ☑ Log all data processing activities
```

---

## CASL (Canada)

### Consent Requirements

CASL requires express or implied consent before sending commercial electronic messages (CEMs) to Canadian recipients.

| Consent Type | Definition | Platform Support |
|--------------|------------|------------------|
| Express consent | Recipient actively agreed | Consent tracking with timestamp and method |
| Implied consent | Existing business relationship (< 2 years) | Relationship tracking with expiry |
| Implied consent (conspicuous publication) | Business email published with statement inviting contact | Source documentation in contact record |

### Key Requirements

| Requirement | Platform Support |
|-------------|------------------|
| Consent before sending | Enforced in strict mode; configurable |
| Sender identification | Name, business, contact info in email | Auto-injected from org settings |
| Unsubscribe mechanism | Free, easy, honored within 10 days | Immediate suppression |
| Consent records | Must be retained | `consent_records` table with audit trail |

### Platform Configuration

```
Organization Settings → Compliance → CASL
  ☑ Require express or implied consent
  Consent verification: [Strict / Warn / Off]
  Implied consent expiry: [24 months]
  ☑ Track consent source and method
```

---

## Universal Platform Requirements

Regardless of jurisdiction, Atlas Sales OS enforces these requirements on every outbound email:

| Requirement | Enforcement |
|-------------|-------------|
| Unsubscribe link present | Send blocked if missing |
| Sender identification | Send blocked if missing |
| Recipient not suppressed | Send blocked if on suppression list |
| Honest subject line | Quality check flags deceptive subjects |
| Audit trail | Every send logged with full context |
| Bounce handling | Hard bounces → immediate suppression |
| Complaint handling | Spam complaints → immediate suppression + alert |

These cannot be disabled by operators.

---

## Geographic Configuration

Operators can configure geographic outreach restrictions:

```
Organization Settings → Compliance → Geographic
  Allowed countries: [All / Selected list]
  Blocked countries: [None / Selected list]
  ☑ Warn when contact country unknown
  ☑ Block send to contacts in blocked countries
```

When a contact's country is in a blocked list, the send is prevented and logged.

---

## Record Keeping

| Record | Retention | Storage |
|--------|-----------|---------|
| Send records | Configurable (default: 24 months) | `send_records` table |
| Consent records | Duration of consent + 3 years | `consent_records` table |
| Suppression entries | Indefinite (until manually removed) | `suppression_entries` table |
| Audit logs | Configurable (default: 36 months) | `audit_logs` table |
| Unsubscribe requests | Indefinite | `suppression_entries` table |
| Contact history | Configurable (default: 24 months) | Contact-related tables |

---

## Related Documents

- [Compliance Overview](./overview.md)
- [ADR-0006: Email Deliverability](../architecture/adrs/0006-email-deliverability-architecture.md)
- [Product Charter](../product/charter.md)
