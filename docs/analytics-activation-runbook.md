# Harkingbade Analytics Activation Runbook

Status: implemented locally; collection deliberately disabled  
Updated: 2026-08-16

## Decision

Use two Cloudflare measurement layers with different jobs:

1. **Cloudflare Web Analytics** for page views, traffic sources, devices, geography, and Core Web Vitals.
2. **Workers Analytics Engine** for Harkingbade's allow-listed commercial events such as career intent, service views, diagnostic completion, and successful contact delivery.

Cloudflare's current documentation states that Web Analytics collects performance and traffic data through its beacon, while Analytics Engine accepts ordered data points from Workers and supports SQL/GraphQL queries. Analytics Engine data is retained for three months. Sources:

- <https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/>
- <https://developers.cloudflare.com/analytics/analytics-engine/get-started/>
- <https://developers.cloudflare.com/analytics/analytics-engine/limits/>

## Privacy boundary

The custom-event path is deliberately narrower than the broader event vocabulary in most product-analytics tools.

It does not accept or write:

- names, email addresses, companies, messages, résumé data, or form contents;
- URL query strings or fragments;
- IP addresses, user-agent strings, cookies, fingerprints, or persistent visitor identifiers;
- arbitrary event names or properties.

The browser code skips collection when Global Privacy Control or Do Not Track is enabled. It uses no cookies or local storage. The Worker validates an event/property allow-list, limits event bodies to 4 KiB, strips query strings from accepted paths, and uses only the site hostname as Analytics Engine's sampling key.

These controls reduce the data footprint. They do not replace jurisdiction-specific privacy, consent, retention, or legal review.

## Runtime gate

`wrangler.jsonc` declares separate datasets:

| Environment | Dataset | Default |
|---|---|---|
| Local | `harkingbade_events_local` | Disabled |
| Staging | `harkingbade_events_staging` | Disabled |
| Production | `harkingbade_events_production` | Disabled |

`ANALYTICS_ENABLED` must remain `false` until the privacy policy, target markets, account ownership, operator, and query access have been approved. When disabled, `/api/events` validates a request and returns `204` without writing a data point.

## Dataset schema

Dataset names: `harkingbade_events_local`, `harkingbade_events_staging`, and `harkingbade_events_production`.

| Column | Meaning |
|---|---|
| `blob1` | Event name |
| `blob2` | Current page path |
| `blob3` | Source page path |
| `blob4` | Internal destination path or approved external host |
| `blob5` | CTA, work, service, or resource identifier |
| `blob6` | Audience route, interest, method, or primary 4D stage |
| `blob7` | Band, status, action, error class, consent version, or link type |
| `blob8` | Site hostname |
| `double1` | Event count, always `1` |
| `double2` | Bounded numeric value; currently diagnostic total score or `0` |
| `index1` | Site hostname, used only as the sampling key |

The implementation uses eight of the currently supported twenty blobs, two of twenty doubles, one index, and one data point per event. Cloudflare currently permits one index and up to 250 data points per Worker invocation: <https://developers.cloudflare.com/analytics/analytics-engine/limits/>.

## Activation sequence

1. Confirm the intended Cloudflare account and record the operator.
2. Review the live privacy policy for target markets and planned advertising/CRM integrations.
3. Enable Cloudflare Web Analytics for the production hostname. The CSP already allows `static.cloudflareinsights.com`; verify the beacon and `/cdn-cgi/rum` request on staging before production.
4. Create a least-privilege API token with Account Analytics Read permission for query verification. Never place it in client code or commit it.
5. Change `ANALYTICS_ENABLED` to `true` in staging only, run `npm run types:worker`, deploy staging, and repeat the smoke suite.
6. Generate controlled `career_intent`, `service_view`, `diagnostic_complete`, and contact success/error events without using real personal data.
7. Wait for ingestion, query the staging dataset, and confirm field placement, privacy boundaries, and sampling-aware totals.
8. Return staging to its intended configuration, enable production only after approval, deploy, and record the version and rollback target.
9. Verify the weekly operating dashboard before beginning outreach or paid experiments.

## Sampling-aware query templates

Use the external SQL API with a short-lived, least-privilege token. Do not put the token in this repository.

### Events by type

```sql
SELECT
  blob1 AS event_name,
  SUM(_sample_interval * double1) AS estimated_events
FROM harkingbade_events_production
WHERE timestamp >= NOW() - INTERVAL '7' DAY
GROUP BY event_name
ORDER BY estimated_events DESC
```

### High-intent routes

```sql
SELECT
  blob1 AS event_name,
  blob2 AS page_path,
  blob5 AS object_id,
  SUM(_sample_interval * double1) AS estimated_events
FROM harkingbade_events_production
WHERE timestamp >= NOW() - INTERVAL '30' DAY
  AND blob1 IN ('career_intent', 'contact_submit_success', 'diagnostic_cta')
GROUP BY event_name, page_path, object_id
ORDER BY estimated_events DESC
```

### Service demand signal

```sql
SELECT
  blob5 AS service_id,
  SUM(_sample_interval * double1) AS estimated_views
FROM harkingbade_events_production
WHERE timestamp >= NOW() - INTERVAL '30' DAY
  AND blob1 = 'service_view'
GROUP BY service_id
ORDER BY estimated_views DESC
```

Cloudflare's SQL endpoint and authentication requirements are documented at <https://developers.cloudflare.com/analytics/analytics-engine/sql-api/>.

## Acceptance evidence

Activation is not complete until all of the following are captured:

- the account, Worker version, dataset, runtime flag, and activation date;
- browser evidence that Web Analytics loads without CSP errors;
- SQL results for controlled events with no forbidden fields;
- contact and newsletter measurement failures do not block their underlying forms;
- Global Privacy Control and Do Not Track suppress client event requests;
- rollback restores the prior Worker version and collection state;
- the privacy page accurately names every active provider and purpose.
