# Harkingbade Launch Preflight

Status: implemented; current staging and production reports are blocked by missing private/operator evidence  
Purpose: make release blockers executable without reading secrets or treating an attestation as a deployment

## Targets

Run staging preflight before any account-owned preview deployment:

```sh
npm run launch:preflight -- --target staging
```

Run production preflight before requesting cutover approval:

```sh
npm run launch:preflight -- --target production
```

Reports are written to ignored files under `docs/private/`. A blocked preflight exits with code `2`. Add `--allow-incomplete` only when intentionally generating a progress report.

## What is checked directly

- Required build outputs exist and are not older than site, public-asset, Worker, Astro, or Wrangler sources.
- Analytics Engine remains disabled in local, staging, and production configuration unless deliberately activated through its own runbook.
- The built newsletter route is either safely disabled or identified as requiring provider evidence.
- The built contact route either omits the unverified form or is identified as requiring delivery evidence.
- The private founder evidence contract passes without copying its values into the report.
- The private traffic/URL output exists and consequential risk/P0/P1 URLs are decided.
- `public/_redirects` exactly matches approved 301 decisions when recovery evidence is available.
- The operator release record contains the evidence appropriate to staging or production.

## Operator release record

Copy `data/release-evidence.example.json` to the ignored path `data/private/release-evidence.json`. The record is an operator attestation with private evidence references, not a secret store.

Staging requires:

- intended Cloudflare account and zone confirmed;
- current 503 route inspected;
- rollback state captured;
- operator, review date, and private evidence references recorded.

Production additionally requires:

- staging URL, smoke pass, and noindex proof;
- a verified webhook contact route, a verified email-only route reflected on the page, or an intentionally disabled route reflected on the page;
- newsletter disabled, or provider/domain/consent/unsubscribe/suppression/delivery proof;
- Search Console ownership and sitemap submission readiness;
- a recorded staging performance trace;
- an approved cutover window and rollback owner.

## Privacy and authority boundary

The report contains only statuses, counts, and next actions. It does not copy founder records, traffic metrics, account identifiers, contact data, evidence references, or secret values. It never opens `.dev.vars`, deploys a Worker, changes DNS, enables analytics, publishes newsletter signup, or approves a cutover.

A `READY_FOR_NEXT_GATE` result means the documented prerequisites are present. It does not authorize deployment and cannot replace staging or production runtime verification.
