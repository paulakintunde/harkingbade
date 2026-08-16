# Harkingbade Measurement Plan

Status: conversion instrumentation implemented locally; collection disabled pending production privacy and account review

## North-star outcome

**Qualified opportunities created by owned expertise.**

A qualified opportunity is a career, service, product, partnership, or audience action that matches the chosen market and advances to a defined next step. Raw traffic is not an opportunity.

## Outcome scorecard

| Outcome | Primary measure | Quality measure | Decision use |
|---|---|---|---|
| Career | Qualified hiring conversations | Interview progression and role fit | Refine target role, proof, and applications |
| Services | Qualified leads and paid engagements | Close rate, value, delivery fit, margin | Refine offer, audience, scope, and price |
| Audience | Engaged owned subscribers | Replies, return visits, resource use, buyers | Refine topic, format, and cadence |
| Products | Paid activation and repeat use | Refund, completion, retention, support load | Improve or retire the product |
| Search | Qualified organic landing sessions | Query intent, engagement, assisted opportunity | Keep, improve, consolidate, or retire content |
| Reliability | Successful requests and form delivery | Error rate, uptime, crawl failures | Fix platform risk before growth work |

## Event specification

Do not send names, email addresses, message text, resume data, or other personal information to analytics.

| Event | Trigger | Required properties | Conversion level |
|---|---|---|---|
| `cta_click` | Primary or secondary CTA activated | `cta_id`, `page_path`, `destination`, `audience_route` | Leading |
| `work_view` | Case study reaches meaningful view threshold | `work_id`, `status`, `source_page` | Leading |
| `service_view` | Service section/page viewed | `service_id`, `source_page` | Leading |
| `contact_start` | First interaction with contact form | `interest`, `source_page` | Micro |
| `contact_submit_success` | Worker confirms delivery | `interest`, `source_page` | Primary |
| `contact_submit_error` | Worker returns an error | `error_class`, `source_page` | Reliability |
| `career_intent` | Career route activated | `source_page`, `destination` | Primary |
| `resource_use` | Resource opened or print action used | `resource_id`, `action`, `source_page` | Micro |
| `diagnostic_start` | First 4D Diagnostic response selected | `resource_id`, `source_page` | Leading |
| `diagnostic_complete` | A complete 4D result is calculated locally | `resource_id`, `band`, `primary_stage`, `total_score` | Micro |
| `diagnostic_cta` | Result CTA to contact or decision canvas is activated | `resource_id`, `destination`, `primary_stage` | Primary |
| `newsletter_intent` | Newsletter/RSS route activated | `method`, `source_page` | Micro |
| `newsletter_subscribe_success` | Worker confirms subscription-request delivery | `source_page`, `consent_version` | Primary |
| `newsletter_subscribe_error` | Worker rejects or cannot deliver a subscription request | `error_class`, `source_page` | Reliability |
| `outbound_click` | Approved external professional link activated | `destination_host`, `link_type`, `source_page` | Leading |

## Search recovery measures

- Domain availability and HTTPS reliability.
- Valid indexed canonical pages.
- Pages excluded by reason.
- Non-brand impressions and clicks.
- Branded search demand.
- Query and landing-page diversity.
- Crawl errors and sitemap processing.
- Relevant backlinks and citations.
- Qualified organic opportunity rate.

Analyze traffic decline and recovery by page, query, country, device, search type, and date. Do not interpret a site-wide average as a diagnosis.

## Content decision rules

At 30, 60, and 90 days after a meaningful content release:

- **Keep/expand** when it earns qualified impressions, citations, subscribers, resource use, or opportunities.
- **Improve** when the intent is correct but the page has weak engagement, missing evidence, or a measurable conversion break.
- **Consolidate** when multiple pages compete for the same need without distinct value.
- **Retire** when it is obsolete, unsafe, outside the site purpose, or unsupported after a sufficient observation window.

No page is refreshed solely to change its date.

## Initial dashboards

### Weekly operating view

- Domain/API errors and form delivery.
- Search Console indexing/crawl changes.
- Qualified opportunities by source.
- Contact and resource conversion paths.
- Content released and evidence status.

### Monthly strategy view

- Career pipeline and interview influence.
- Service pipeline, revenue, and delivery fit.
- Subscriber quality and owned distribution.
- Search query/topic movement.
- Revenue per 1,000 qualified visits.
- Experiments completed, decisions made, and assumptions retired.

## Implementation gate

The initial measurement architecture is now intentionally split:

- **Cloudflare Web Analytics** is the proposed traffic and Core Web Vitals baseline. It is dashboard-only and does not provide custom commercial events.
- **Workers Analytics Engine** receives only allow-listed commercial events through `/api/events`. It stores no submitted name, email, company, message, résumé data, complete URL query string, cookie ID, fingerprint, or persistent visitor ID.
- Client instrumentation honours Global Privacy Control and browser Do Not Track signals. It uses neither cookies nor local storage.
- `ANALYTICS_ENABLED` remains `false` in local, staging, and production configuration. Valid events return `204` but are not written until the gate is deliberately changed and deployed.

The event schema, activation sequence, sampled SQL queries, CSP requirements, and verification gates are documented in `docs/analytics-activation-runbook.md`. Consent and disclosure behaviour must still be reviewed against the actual target markets and any later advertising, CRM, or product-analytics providers. This implementation is a data-minimization control, not a legal-compliance claim.
