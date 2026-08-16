---
title: "Migrating a legacy WordPress brand to Astro and Cloudflare without erasing URL equity"
description: "A field plan for separating content recovery, redirect decisions, static delivery, Worker APIs, and search verification during a high-risk rebuild."
publishedAt: 2026-08-16
pillar: "build"
evidenceType: "field-note"
status: "in-progress"
featured: true
draft: false
sources:
  - "https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes"
  - "https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/"
  - "https://developers.cloudflare.com/workers/static-assets/"
---

A legacy-site migration is not primarily a framework change. It is an information recovery and routing decision with a new delivery layer attached.

Rebuilding first and deciding redirects later is how migrations turn a damaged search asset into an unrecoverable one.

## Preserve evidence before changing the system

Export Search Console performance, indexing, sitemaps, manual actions, security issues, crawl statistics, and links. Export Analytics landing pages and acquisition history. Recover the WordPress database, uploads, sitemap files, redirect plugins, DNS records, and server logs where possible.

Archive data is useful when those systems are unavailable, but it does not reveal conversions, canonical choices, manual actions, or which URLs retained search demand.

## Build a URL ledger, not a redirect guess

Give every historical URL an explicit disposition:

1. Keep and substantially improve it when the same need remains useful and supportable.
2. Consolidate and redirect it only to a page that satisfies closely matching intent.
3. Return 404 or 410 when it is obsolete and has no relevant replacement.
4. Hold it for review when it involves downloads, activation, privacy, accounts, or legal risk.

The ledger should record the old URL, archive title, historical traffic, backlinks, target intent, risk, decision, destination, reason, owner, and verification status.

## Keep the public site static by default

Astro pre-renders pages by default. Cloudflare Workers Static Assets can serve that output without executing Worker code for every page request.

The Harkingbade configuration uses asset-first delivery and selectively runs Worker code first for `/api/*`. That keeps marketing pages, case studies, and articles simple while preserving an edge runtime for contact delivery and future tools.

```json
{
  "main": "./worker/index.ts",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "404-page",
    "run_worker_first": ["/api/*"]
  }
}
```

## Make content rules executable

Typed content collections enforce properties that WordPress often leaves inconsistent: description length, original publication date, meaningful update date, content pillar, evidence type, draft state, sources, and canonical override.

The schema cannot guarantee a useful article. It can prevent silent metadata decay and make editorial governance visible during review.

## Verify what users and crawlers actually receive

The build passing is only one check. Before changing DNS:

- Crawl the generated site and inspect status, canonical, robots, headings, links, and sitemap coverage.
- Test representative legacy redirects and deliberate 404/410 responses.
- Verify assets are cached while HTML can update.
- Test the site without JavaScript, by keyboard, and with reduced motion.
- Run the Worker locally and confirm `/api/health`, contact validation, and unconfigured-secret failure behaviour.
- Keep preview and `workers.dev` versions out of the index or outside public discovery until the canonical domain is ready.

The migration is complete only when important old URLs have verified outcomes and the new site produces reliable evidence—not when the homepage looks finished.
