---
title: "Designing privacy-conscious conversion analytics on Cloudflare Workers"
description: "A tested architecture for measuring career, service, newsletter, and diagnostic intent without cookies, personal data, query strings, or visitor IDs."
publishedAt: 2026-08-16T12:00:00-07:00
pillar: "grow"
evidenceType: "case-study"
status: "published"
featured: true
draft: false
sources:
  - "https://developers.cloudflare.com/analytics/analytics-engine/get-started/"
  - "https://developers.cloudflare.com/analytics/analytics-engine/limits/"
  - "https://developers.cloudflare.com/analytics/analytics-engine/sql-api/"
  - "https://developers.cloudflare.com/analytics/analytics-engine/sampling/"
  - "https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/"
---

Page views do not answer the question Harkingbade needs to learn first: does the site create qualified career, service, resource, and audience intent?

A conventional product-analytics installation could answer more questions, but it could also introduce cookies, persistent identifiers, form leakage, query-string collection, and a consent system before the target markets are even chosen. The alternative is not to avoid measurement. It is to constrain the measurement system to the current decision.

This note describes the system implemented in the Harkingbade rebuild. It is verified locally and disabled in every Cloudflare environment. It has no production data yet.

## Split traffic measurement from commercial events

The architecture gives two different jobs to two different systems.

**Cloudflare Web Analytics** is the proposed traffic and real-user performance baseline. Cloudflare documents that its performance beacon uses browser navigation timing data and does not track individual users across customer sites.

**Workers Analytics Engine** receives a small custom event vocabulary through `/api/events`. It answers product and commercial questions Web Analytics cannot: which service attracted meaningful attention, whether a career route was activated, whether the [4D Diagnostic](/resources/4d-diagnostic/) was completed, and whether a form request succeeded or failed.

The split matters. Page and performance analytics should not quietly become an identity system, and a commercial event endpoint should not pretend to replace Search Console, real-user performance data, sales records, or customer research.

## Start with a forbidden-data list

The first schema decision was what the endpoint must never accept:

- names, email addresses, companies, messages, or résumé information;
- URL query strings and fragments;
- cookies, fingerprints, IP addresses, or persistent visitor identifiers;
- arbitrary event names or arbitrary properties;
- complete diagnostic answers.

That boundary is enforced at the Worker, not left to developer convention. An unexpected property such as `email` returns `422`. Paths are normalized to their pathname before validation succeeds. Request bodies are capped at 4 KiB.

The browser also suppresses event transmission when Global Privacy Control or Do Not Track is enabled. It uses neither cookies nor local storage. Those controls minimize collection; they are not a claim that one implementation automatically satisfies every market's legal requirements.

## Make the event vocabulary executable

The measurement plan defines fifteen events covering leading signals, micro-conversions, primary conversions, and reliability failures. Examples include:

| Event | Decision it supports | Bounded properties |
|---|---|---|
| `career_intent` | Is the career route creating action? | source path, destination path |
| `service_view` | Which offer receives meaningful attention? | service ID, source path |
| `contact_submit_success` | Did a qualified route reach delivery? | interest, source path |
| `diagnostic_complete` | Is the resource being completed? | band, primary stage, bounded total score |
| `newsletter_subscribe_error` | Is acquisition failing operationally? | error class, source path |

The Worker stores only properties allowed for that event. A valid event with an extra field still fails. This prevents a future interface change from silently sending form contents or campaign parameters into analytics.

```ts
const validation = validateAnalyticsEvent(payload);
if (!validation.ok || !validation.data) {
  return json({ ok: false, error: validation.error }, 422);
}
```

The implementation and validation tests live in `worker/analytics.ts` and `worker/analytics.test.ts` in the project source.

## Keep collection behind a runtime gate

Local, staging, and production have separate Analytics Engine dataset bindings. All three also set:

```json
{
  "ANALYTICS_ENABLED": "false"
}
```

When the flag is false, the Worker still validates a bounded event and returns `204`, but it does not write a data point. This lets the client journey, schema, privacy rejection, and failure isolation be tested before collection is approved.

Activation requires an account owner, a reviewed privacy policy, target-market decisions, least-privilege query access, controlled staging events, a rollback record, and proof that form behavior does not depend on analytics success.

## Design the Analytics Engine row before writing it

Analytics Engine accepts ordered arrays of blobs, doubles, and one index. That makes a documented field order essential.

Harkingbade currently uses:

| Field | Meaning |
|---|---|
| `blob1` | Event name |
| `blob2` | Current page path |
| `blob3` | Source page path |
| `blob4` | Internal destination or approved external host |
| `blob5` | CTA, work, service, or resource ID |
| `blob6` | Audience route, interest, method, or primary 4D stage |
| `blob7` | Band, status, action, error class, consent version, or link type |
| `blob8` | Site hostname |
| `double1` | Event count, always `1` |
| `double2` | Bounded numeric value, currently diagnostic score or `0` |
| `index1` | Site hostname used only as the sampling key |

Cloudflare currently permits up to twenty blobs, twenty doubles, one index, and 250 data points per Worker invocation. The index is limited to 96 bytes, and Analytics Engine retains data for three months. This implementation writes one data point per accepted event and uses the hostname—not a visitor—as the sampling key.

```ts
env.ANALYTICS.writeDataPoint({
  blobs: [event, pagePath, sourcePath, destination, objectId, route, outcome, hostname],
  doubles: [1, boundedValue],
  indexes: [hostname],
});
```

Cloudflare's write is non-blocking. The Worker does not await it, and measurement never determines whether the visitor can continue their task.

## Query with sampling in mind

Analytics Engine exposes `_sample_interval` because writes or reads may be sampled at sufficient volume. A raw row count can therefore understate the represented events.

The operating query weights the count value:

```sql
SELECT
  blob1 AS event_name,
  SUM(_sample_interval * double1) AS estimated_events
FROM harkingbade_events_production
WHERE timestamp >= NOW() - INTERVAL '7' DAY
GROUP BY event_name
ORDER BY estimated_events DESC
```

Cloudflare's SQL API requires authenticated account access. Tokens belong in an operator-controlled secret path, never in browser code or repository files.

## Test the privacy boundary, not only the happy path

The automated suite verifies that the system:

- accepts a known event and removes query strings from paths;
- rejects unknown events and an `email` property;
- enforces the independent 4 KiB body limit;
- uses the site hostname rather than a visitor identifier as the sampling key;
- writes only when the explicit runtime gate is true;
- suppresses client transmission for Global Privacy Control and Do Not Track.

The deployment smoke suite also submits one valid event and one forbidden personal-information field against the full local Worker runtime. The current result is `204` for the valid disabled-gate event and `422` for the forbidden field.

## Know what this system cannot prove

This architecture does not provide user-level funnels, multi-touch attribution, cohort analysis, session replay, or advertising optimization. It cannot prove that an event was written successfully because `writeDataPoint()` is non-blocking. It cannot replace form delivery records, qualified-opportunity review, Search Console, or revenue evidence.

It also has no production outcome yet. Collection remains off while the live domain returns `503` and the account-side route is unverified.

The design is successful only if it produces enough evidence to change a product, content, career, or commercial decision without collecting data Harkingbade does not need.

For the complete operating sequence, see the [Harkingbade recovery case study](/work/harkingbade-recovery/) or inspect the [service engagement boundaries](/services/).
