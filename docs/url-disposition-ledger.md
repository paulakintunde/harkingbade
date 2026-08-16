# Legacy URL Disposition Ledger

Status: template; final decisions require Search Console, analytics, backlink, archive, WordPress, legal, and current-content evidence

## Decision rules

Every historical URL receives exactly one primary disposition:

1. **KEEP** — same user intent remains useful, safe, current, and supportable with first-hand expertise. Rebuild it at the same URL when practical.
2. **301** — a close replacement genuinely satisfies the original need. Record one hop directly to the final canonical URL.
3. **404** — the page is absent or retired, has no close replacement, and may plausibly return later.
4. **410** — the page is deliberately and permanently removed with no close replacement.
5. **REVIEW** — legal, security, privacy, account/login, download, activation, piracy, malware, or misleading-intent risk requires a human decision.

Do not redirect unrelated posts, tags, categories, search pages, or risky URLs to the homepage or `/insights/`.

## Priority model

Review in this order:

1. URLs with historical conversions or advertising revenue.
2. URLs with current impressions/clicks in Search Console.
3. URLs with valuable, relevant backlinks.
4. URLs involved in manual actions, security issues, or risky intent.
5. All remaining indexed/archive URLs.

## Ledger

| Old URL | Archive title/topic | Last known status | Historic clicks/sessions | Revenue/leads | Backlinks | Current intent | Risk | Decision | Destination | Reason | Owner | Verified date |
|---|---|---:|---:|---:|---:|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |  |  |  |

No redirect is currently approved in `public/_redirects`. The public archive inventory is generated in `data/legacy-url-inventory.json`; it supplies discovery and review queues but does not make disposition decisions.

## Verification checklist

For each KEEP or 301 decision:

- Old and new intent are materially the same.
- The destination is indexable, canonical, useful, and complete.
- There is no redirect chain or loop.
- Internal links point directly to the destination.
- Sitemap contains only the final canonical URL.
- Status and `Location` header are tested on local preview and production.
- Search Console is monitored after launch.

For each 404/410 decision:

- No close replacement exists.
- Important backlinks and historical conversions were reviewed.
- Removal does not break a required user journey.
- The response contains a real 404/410 status, not a soft-404 page with status 200.
- The custom error experience offers navigation without pretending to answer the old query.

## Production redirect format

Add only approved rules to `public/_redirects`:

```text
/old-path/ /closely-matching-new-path/ 301
```

Keep the ledger as the reason record; `_redirects` is only the executable output.
