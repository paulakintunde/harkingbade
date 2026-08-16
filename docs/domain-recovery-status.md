# Harkingbade Domain Recovery Status

Status: confirmed public baseline; Cloudflare account inspection and production cutover pending  
Checked: 2026-08-16 12:26 UTC (05:26 PDT)

## Confirmed findings

| Layer | Result | Evidence |
|---|---|---|
| Apex DNS | Resolves | `104.21.79.115`, `172.67.170.131` |
| IPv6 DNS | Resolves | Two Cloudflare IPv6 addresses |
| Nameservers | Delegated to Cloudflare | `ken.ns.cloudflare.com`, `kiki.ns.cloudflare.com` |
| `www` DNS | Resolves | Same Cloudflare edge addresses as apex |
| HTTP apex | Responds with `301` | Redirects to `https://harkingbade.com/` |
| HTTPS apex | Responds with `503` | Cloudflare edge response; body is `no available server` |
| HTTPS `www` | Responds with `503` | Same body and response pattern |
| Crawl endpoints | Respond with `503` | `/robots.txt`, `/sitemap.xml`, and `/sitemap-index.xml` |
| Historical application endpoint | Responds with `503` | `/wp-json/` |
| Sample indexed legacy article | Responds with `503` | `/vps-hosting-glossary-50-terms-every-user-should-know/` |

The immediate outage is therefore **not a DNS delegation failure**. The Cloudflare edge is reachable, but it has no functioning application response for any tested HTTPS host or path. Public evidence alone cannot safely identify whether the failing component is an origin, Worker route or service binding, load balancer, tunnel, or another account-level routing configuration.

This live outage is sufficient to explain why the site cannot currently earn visits, leads, or advertising revenue. It does **not** explain the original historical traffic decline. Search Console, analytics, AdSense, security, backlink, and migration evidence remain necessary for that diagnosis.

Cloudflare's current 503 guidance recommends separating Cloudflare-generated failures from origin-generated failures and inspecting Worker logs and origin health as applicable. Load-balanced origins also need pool and endpoint health review. See [Cloudflare Error 503](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/error-503/) and [Cloudflare pool health](https://developers.cloudflare.com/load-balancing/understand-basics/health-details/).

## Account-side diagnostic order

Perform these checks in the Cloudflare account that owns `harkingbade.com`:

1. Confirm the zone is active and the account is the intended production account.
2. In **DNS > Records**, record the actual apex and `www` record types, targets, proxy status, and any old origin addresses before changing them.
3. In **Workers & Pages**, inspect custom domains, routes, service bindings, deployments, and recent Worker logs for both hosts.
4. If **Load Balancing** is enabled, inspect the load balancer, fallback pool, endpoints, monitors, and current health.
5. If a **Cloudflare Tunnel** is referenced, verify the connector is online and its public-hostname service target is reachable.
6. Inspect origin hosting status, certificates, application logs, firewall rules, resource exhaustion, and the last known healthy deployment.
7. Review **Security Events** for mitigations that coincide with the 503s.
8. Export the existing configuration and evidence before replacing routes or records.

Do not point DNS at a guessed origin and do not add blanket legacy redirects. The new Astro Worker is already built and dry-run verified, but it should first be deployed to an account-owned staging hostname and tested. Production attaches only the apex Custom Domain; `www` remains proxied and uses a one-hop Cloudflare Single Redirect to the same apex path.

## Recovery cutover gate

The domain can be cut over to the new site when all of the following are true:

- Wrangler is authenticated to the intended Cloudflare account.
- A preview deployment returns `200` for the site and `/api/health`.
- The contact path is either fully configured and tested or clearly disabled for launch.
- Apex is canonical; `www` redirects one hop to the exact apex path.
- `robots.txt`, sitemap, canonical URLs, structured data, security headers, caching, and the real 404 status pass production checks.
- Approved legacy 301s are narrow and intent-matched; other removed paths return 404 or 410.
- Search Console ownership, sitemap submission, analytics baseline, and uptime monitoring are ready.
- The previous routing configuration is captured so rollback is possible.

The executable sequence and rollback procedure are in `docs/production-cutover-runbook.md`.

## Repeat the public check

From the project directory:

```sh
npm run research:domain
```

The command prints DNS, status, redirect, Cloudflare request ID, content type, response size, latency, and a short body sample. It is diagnostic only and does not alter DNS or Cloudflare configuration.
