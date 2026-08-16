# Harkingbade Production Cutover Runbook

Status: implementation-ready; requires Cloudflare account authorization and founder-owned secrets  
Architecture: Astro static assets + Worker-first `/api/*` + apex Custom Domain + zone-level `www` redirect

## Release topology

| Environment | Worker | Public endpoint | Indexing | Purpose |
|---|---|---|---|---|
| Local | `harkingbade` | `127.0.0.1:8787` | Not public | Full local Worker/static preview |
| Staging | `harkingbade-staging` | Cloudflare `workers.dev` | `X-Robots-Tag: noindex, nofollow` | Account-owned smoke testing |
| Production | `harkingbade-production` | `https://harkingbade.com` | Indexable | Canonical public site |

The production Worker is the application origin, so it uses a Cloudflare Custom Domain. Only the apex attaches to the Worker. `www` remains a proxied DNS hostname and redirects to the exact apex path through a Cloudflare Single Redirect. Cloudflare recommends Custom Domains when the Worker is the origin and requires a separate redirect rule for `www`/root canonicalization. See [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## 1. Capture the rollback state

Before any production mutation:

1. Export or screenshot Cloudflare DNS records for apex and `www`, including type, target, TTL, and proxy status.
2. Record all Worker routes, custom domains, service bindings, load balancers, tunnels, redirect rules, and recent deployments associated with either hostname.
3. Record the current `503 no available server` result with `npm run research:domain`.
4. Export the current WordPress/origin configuration and content where accessible.
5. Note the exact UTC cutover time and operator.

Do not remove existing account objects until their role in the current 503 route is known.

## 2. Authenticate and verify the account

```sh
npx wrangler login
npx wrangler whoami
```

Confirm that the authenticated account owns the active `harkingbade.com` zone. Stop if the account or zone is different.

## 3. Configure environment-specific secrets

Production:

```sh
npx wrangler secret put CONTACT_WEBHOOK_URL --env production
npx wrangler secret put CONTACT_WEBHOOK_TOKEN --env production
npx wrangler secret put NEWSLETTER_WEBHOOK_URL --env production
npx wrangler secret put NEWSLETTER_WEBHOOK_TOKEN --env production
npx wrangler secret put TURNSTILE_SECRET_KEY --env production
```

Repeat with `--env staging` only when staging has a safe test webhook. Never paste secret values into command arguments, source files, screenshots, logs, or chat.

After the Turnstile widget and secret are both verified, change `TURNSTILE_ENFORCED` to `true` for production, regenerate types, rebuild, and retest. Enforcement fails closed when the secret is missing.

Keep `PUBLIC_NEWSLETTER_ENABLED` unset until the newsletter receiving system has passed delivery, confirmed-opt-in if used, consent-record, suppression, and unsubscribe tests. It is a public Astro build variable, not a Worker secret. Set it to `true` only for the build that should expose the form.

## 4. Deploy and verify staging

```sh
npm run launch:preflight -- --target staging
npm run deploy:dry:staging
npm run deploy:staging
npm run smoke -- https://harkingbade-staging.<account-subdomain>.workers.dev
```

Verify manually:

- The rendered identity, navigation, responsive layout, forms, resource print view, and legal pages.
- `X-Robots-Tag: noindex, nofollow` on HTML responses.
- `/api/health` returns `200` JSON.
- Unknown pages return the custom page with HTTP `404`.
- The contact page is email-only with its public address verified, or form delivery reaches only the intended test destination; use `--require-contact` after configuration.
- Newsletter delivery reaches only an approved test inbox and preserves consent metadata; use `--require-newsletter --newsletter-email=<controlled-inbox>` after configuration.
- No secrets or private evidence appear in HTML, JavaScript, logs, or source maps.

## 5. Prepare canonical host behavior

In **Cloudflare > Rules > Redirect Rules**, create a Single Redirect:

- Source wildcard: `https://www.harkingbade.com/*`
- Target wildcard: `https://harkingbade.com/${1}`
- Status: `301`
- Preserve query string: enabled

Keep `www` proxied so Cloudflare can execute the rule. Save as a draft until the production cutover window if the dashboard supports it.

## 6. Production preflight

```sh
npm test
npm run check
npm run launch:preflight -- --target production
npm run deploy:dry:production
```

Confirm:

- Founder-approved identity, profile links, evidence, and contact address are present.
- Contact is a verified email-only route or has proven form delivery; Turnstile policy matches the production configuration.
- The newsletter form is disabled, or the sending domain, webhook, consent record, unsubscribe route, suppression behaviour, and welcome message have passed end-to-end testing.
- Every approved legacy redirect is recorded in the URL disposition ledger.
- Search Console ownership, sitemap submission, uptime monitoring, and rollback operator are ready.
- Analytics follows `docs/analytics-activation-runbook.md`: collection remains disabled unless the privacy/account review, staging data proof, CSP check, least-privilege query access, and rollback record all pass.
- The current apex record is not an incompatible CNAME. Cloudflare cannot attach a Custom Domain to a hostname with an existing CNAME record.

## 7. Cut over

```sh
npm run deploy:production
```

This deploy attaches the `harkingbade.com` Custom Domain and therefore changes live routing. Activate the prepared `www` redirect immediately after the apex returns `200`.

Do not delete the old route, tunnel, load balancer, or origin configuration until production verification passes and the rollback window closes.

## 8. Verify production

```sh
npm run smoke -- https://harkingbade.com --production
npm run research:domain
```

Then verify from at least two networks or regions:

- Apex homepage and key pages return `200` over HTTPS.
- `www` redirects once to the same apex path and preserves the query string.
- HTTP redirects once to HTTPS.
- `robots.txt`, sitemap, RSS, canonical tags, structured data, headers, and 404 behavior are correct.
- `/api/health`, contact delivery, and any enabled newsletter delivery work.
- Cloudflare Worker logs show no unexpected 5xx response.
- Search Console can fetch the homepage, robots file, and sitemap.

Record status, headers, Cloudflare request IDs, and screenshots in the release evidence.

## 9. Rollback

For a bad Worker release after a known-good production version exists:

```sh
npx wrangler deployments list --env production
npx wrangler rollback --env production
```

For a routing failure during the first cutover, Worker rollback alone is insufficient. Remove or detach the new Custom Domain and restore the captured DNS/route configuration exactly. Disable the `www` redirect if the restored route requires `www` to serve directly. Re-run the domain check and record the rollback time.

Because the pre-cutover site currently returns a host-wide 503, restoring it is not a successful recovery. If the new Worker is healthy but a secondary integration fails, prefer disabling that integration or rolling back the Worker version while keeping the functioning static site online.
