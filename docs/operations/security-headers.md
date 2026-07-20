# Next.js Security Headers — Atlas Sales OS

Configured in `apps/web/next.config.ts` for all routes.

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking protection |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer leakage |
| `Permissions-Policy` | Restricts camera, mic, geolocation | Reduces attack surface |
| `X-DNS-Prefetch-Control` | `on` | Performance (safe default) |

## Future (M1+)

- Content Security Policy (CSP) — add when third-party scripts are known
- Strict Transport Security (HSTS) — enforced by Vercel on production domains

## Verification

```bash
curl -I https://your-deployment.vercel.app/health
```

Or use browser DevTools → Network → Response Headers.
