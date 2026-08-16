# Harkingbade

A proof-led personal brand and commercial platform for a **Product & Growth Systems Builder**.

The site is static-first Astro on Cloudflare Workers Static Assets. Public pages are pre-rendered; only `/api/*` routes run the Worker first.

## Current status

- Strategy and repositioning: complete working direction.
- Astro site foundation: implemented.
- Cloudflare Worker: implemented and locally verified.
- Contact delivery: the public form is build-gated off by default; the current build shows an email-only route until a real webhook and secrets pass delivery verification.
- Newsletter acquisition: consent-aware form and Worker delivery are implemented but launch-gated until a verified sending provider, unsubscribe path, and webhook are configured.
- Turnstile: supported but disabled until both site and secret keys are configured.
- Commercial event analytics: implemented with an allow-listed, privacy-conscious Workers Analytics Engine path; collection remains disabled pending production review.
- Professional identity, résumé, testimonials, validated pricing, and historical search evidence: pending founder inputs.
- Live domain: Cloudflare DNS and edge are reachable, but all tested HTTPS paths return `503 no available server` as of 2026-08-16.
- Production deployment and DNS cutover: not performed.

The site never invents missing proof. Provisional work is labelled `in-progress`.

## Stack

- Astro 7, static output
- Typed Astro content collections
- Cloudflare Workers Static Assets
- Selective Worker-first routing for `/api/*`
- Wrangler-generated Worker types
- Vitest for Worker input and validation tests
- Consent-versioned, provider-agnostic newsletter delivery with a build-time launch gate
- Gated Cloudflare Analytics Engine conversion events with no cookies, query strings, form contents, or persistent visitor identifiers
- XML sitemap, RSS, robots rules, canonical URLs, structured data, security headers, redirects, and a true 404

## Local development

Requirements: Node.js 22.12 or newer.

```sh
npm install
npm run types:worker
npm run dev
```

Astro development runs at `http://localhost:4321`. The Astro server does not execute the separate Cloudflare Worker. Use the production-style preview to test the complete site and API:

```sh
npm run build
npm run preview
```

Wrangler preview defaults to `http://localhost:8787`.

## Verification

```sh
npm run test
npm run check
npm run build
npm run deploy:dry
```

`deploy:dry` bundles the Worker and inventories the static upload without publishing it.

## Contact Worker configuration

The contact API is implemented, but the public form is hidden by default. The safe build shows an email-only route and does not ship the form script. Configure the webhook secrets independently for staging before enabling the form:

```sh
npx wrangler secret put CONTACT_WEBHOOK_URL --env staging
npx wrangler secret put CONTACT_WEBHOOK_TOKEN --env staging
```

`CONTACT_WEBHOOK_URL` must accept a JSON `POST`. The payload is:

```json
{
  "name": "string",
  "email": "string",
  "company": "string",
  "interest": "string",
  "message": "string",
  "source": "string",
  "requestId": "uuid",
  "submittedAt": "ISO-8601 timestamp"
}
```

When `CONTACT_WEBHOOK_TOKEN` is present, the Worker sends it as `Authorization: Bearer <token>`.

The API rejects oversized bodies, invalid fields, honeypot submissions, and disallowed origins. It uses request timeouts, no-store responses, structured logs, and no request-scoped global state.

After the staging webhook is configured, compile the opt-in form branch, deploy staging, and require real delivery in the controlled smoke test:

```powershell
$env:PUBLIC_CONTACT_FORM_ENABLED = "true"
npm.cmd run build
npm.cmd run deploy:staging
npm.cmd run smoke -- https://harkingbade-staging.<account-subdomain>.workers.dev --require-contact
```

Set production webhook secrets and enable the same build flag only after the staging request reaches the intended destination. If delivery is not ready, leave `PUBLIC_CONTACT_FORM_ENABLED` unset or `false`; production preflight then requires the public email route to be verified. Turnstile has its own two-sided site-key/secret activation gate below.

## Newsletter Worker configuration

The newsletter form is hidden by default. Configure encrypted secrets independently for each environment:

```sh
npx wrangler secret put NEWSLETTER_WEBHOOK_URL --env staging
npx wrangler secret put NEWSLETTER_WEBHOOK_TOKEN --env staging
```

`NEWSLETTER_WEBHOOK_URL` must accept a JSON `POST` with this payload:

```json
{
  "email": "string",
  "source": "string",
  "list": "harkingbade-field-note",
  "consentVersion": "field-note-v1-2026-08-16",
  "consentedAt": "ISO-8601 timestamp",
  "requestId": "uuid"
}
```

The provider or receiving automation must preserve the consent fields, provide a working unsubscribe path, suppress unsubscribed addresses, and preferably require confirmed opt-in. The Worker never logs the subscriber email.

Only after end-to-end delivery and unsubscribe tests pass, expose the form at Astro build time:

```powershell
$env:PUBLIC_NEWSLETTER_ENABLED = "true"
npm.cmd run build
```

Use an approved test inbox for the full smoke check:

```sh
npm run smoke -- https://staging-host.example --require-newsletter --newsletter-email=controlled-inbox@example.com
```

Leaving `PUBLIC_NEWSLETTER_ENABLED` unset or set to any value other than `true` preserves the RSS-first setup notice and prevents a broken public signup.

### Turnstile activation

Turnstile is deliberately off by default so the form cannot be enabled with a server secret but no browser widget.

To activate it:

1. Create a Turnstile widget for the production and approved preview hostnames.
2. Make `PUBLIC_TURNSTILE_SITE_KEY` available to the Astro build environment.
3. Store the secret with `wrangler secret put TURNSTILE_SECRET_KEY`.
4. Change `TURNSTILE_ENFORCED` to `"true"` in `wrangler.jsonc`.
5. Run `npm run types:worker`, rebuild, preview, and test both accepted and rejected challenges.

Never commit `.dev.vars`, `.env`, tokens, webhook URLs, or secret keys.

## Deployment

Before production deployment:

1. Confirm the Cloudflare account and Worker names.
2. Configure the required secrets.
3. Run all verification commands.
4. Run `npx wrangler whoami` and confirm the intended account.
5. Run `npm run deploy:staging` and smoke-test the noindex `workers.dev` endpoint.
6. Follow `docs/production-cutover-runbook.md` to capture rollback state and configure the `www` redirect.
7. Run `npm run deploy:production` only in the approved cutover window; this attaches the apex Custom Domain.
8. Verify HTTPS, canonical host redirects, the 404 status, headers, `/api/health`, form delivery, and preview-host indexing controls with `npm run smoke`.
9. Update routing only after the reviewed legacy URL disposition map is present.

Generate a privacy-safe release gate report before either staging or production:

```sh
npm run launch:preflight -- --target staging
npm run launch:preflight -- --target production
```

The preflight reads only known readiness artifacts, never opens secret files, and never deploys. Its contract and operator evidence template are documented in `docs/launch-preflight.md`.

Production deployment is intentionally not automated until account, domain, email delivery, analytics, and URL migration decisions are confirmed.

## Analytics activation

The browser instruments only the commercial events defined in `docs/measurement-plan.md`. `/api/events` validates a strict event/property allow-list and strips query strings before any write. The client honours Global Privacy Control and Do Not Track, and uses no cookies or local storage.

Analytics Engine datasets are declared separately for local, staging, and production, but `ANALYTICS_ENABLED` is `"false"` in every environment. Follow `docs/analytics-activation-runbook.md` for the privacy review, CSP/Web Analytics check, staging proof, sampling-aware queries, and production activation. Do not enable collection merely because the binding exists.

## Content workflow

Insights live in `src/content/insights/`; case studies live in `src/content/work/`. Their schemas enforce metadata, content pillar, evidence type, draft state, publication/update dates, and evidence status.

An update date should change only when the substance changes. Every consequential claim should point to a source, artifact, or measured result.

## Legacy redirects

`public/_redirects` contains only verified intent-matched rules. Do not redirect unrelated retired content to the homepage or Insights index.

Maintain the decision record in `docs/url-disposition-ledger.md` before adding rules.

Refresh the public archive inventory with:

```sh
npm run research:archive
```

This produces `data/legacy-url-inventory.json` and `docs/legacy-url-inventory.md`. Archive evidence is discovery evidence only; it cannot replace Search Console, analytics, backlink, legal, or current-content review.

Join founder-owned Search Console, analytics, backlink, AdSense, and manual-review exports to that inventory with `npm run research:evidence`. The private source contract and safeguards are in `docs/traffic-evidence-import.md`; generated evidence is ignored by version control and never becomes a redirect automatically.

## Founder proof workflow

Copy `data/founder-evidence.example.json` to the ignored path `data/private/founder-evidence.json`, complete it with identity, priority, target-role, target-buyer, capability, commercial-constraint, and project-proof evidence, then run:

```sh
npm run research:founder
```

The validator writes a privacy-safe gate report to `docs/private/founder-evidence-readiness.md`. It requires a 100-point six-month priority allocation and three complete project records approved for public use. It never edits public site copy or repeats the private field values in its report.

Repeat the read-only live domain check with:

```sh
npm run research:domain
```

The confirmed outage baseline and account-side recovery order are recorded in `docs/domain-recovery-status.md`.

## Strategy and operations

- `docs/repositioning-v1.md` — current positioning and 90-day recovery system
- `docs/historical-workbook-reconciliation.md` — sheet-by-sheet decision record for the superseded VPS/search-volume strategy
- `docs/founder-evidence-intake.md` — proof needed for final career and commercial copy
- `docs/url-disposition-ledger.md` — migration decision method and ledger template
- `docs/legacy-url-inventory.md` — reproducible public archive inventory and review queues
- `docs/traffic-evidence-import.md` — private export contract, evidence scoring, and URL-level importer
- `docs/domain-recovery-status.md` — live DNS/HTTP evidence and Cloudflare cutover gate
- `docs/production-cutover-runbook.md` — staging, production, rollback, and verification procedure
- `docs/launch-preflight.md` — executable staging/production blockers and private operator evidence contract
- `docs/completion-audit.md` — requirement-by-requirement evidence, gaps, and acceptance gates
- `docs/measurement-plan.md` — opportunity, audience, search, and reliability measures
- `docs/analytics-activation-runbook.md` — privacy boundary, Analytics Engine schema, activation sequence, SQL checks, and rollback evidence
- `docs/offer-validation-kit.md` — qualification, buyer interviews, pricing validation, proposal structure, and first paid-pilot sprint
- `docs/career-activation-kit.md` — role prioritization, evidence packaging, outreach, interview proof story, and 30-day job-search sprint
- `docs/performance-audit-status.md` — honest trace blocker, required Chrome DevTools setup, acceptance sequence, and current non-trace evidence
- `docs/newsletter-launch-kit.md` — provider contract, launch gate, welcome sequence, first issue, and decision rules
