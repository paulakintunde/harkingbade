# Historical Strategy Workbook Reconciliation

Status: completed read-only review; source workbook unchanged  
Reviewed: 2026-08-16  
Source: `C:\Users\harki\Downloads\harkingbade_strategy.xlsx`  
Decision owner: founder

## Executive decision

The workbook is useful as a record of the previous publishing thesis and as a source of recovery questions. It is not an executable strategy for the rebuilt Harkingbade.

Its central model is a VPS/Linux/self-hosting publication that wins search traffic with a large article inventory and monetizes through hosting affiliates, display ads, and later sponsorships. The current Harkingbade objective is different: make the founder's cross-functional product, positioning, marketing, content, ecommerce, and development capability credible enough to create strong career opportunities and direct commercial revenue.

Executing both models on one site would blur the audience, hide the founder behind commodity tutorials, recreate dependence on Google traffic, and consume the proof-building capacity needed for employment and service revenue. Therefore:

- **Retain** the workbook as a hypothesis bank and legacy-recovery input.
- **Revise** useful quality, trust, internal-linking, research, and monetization ideas into the Product & Growth system.
- **Retire** the proposed VPS-first taxonomy, article quota, unverified keyword/competitor/revenue estimates, and plugin-era implementation instructions.

## What the workbook actually contains

| Sheet | Used range | What it is | Current disposition |
|---|---|---|---|
| Master Index | `A1:E12` | Claims a complete audit, taxonomy, 200+ content plan, keyword research, monetization map, and competitor analysis | Archive as an index only |
| Site Taxonomy | `A1:H83` | Proposed VPS, Linux, self-hosting, and programming information architecture plus deletion candidates | Retire as navigation; use only as URL-review prompts |
| Fix Tracker | `A4:H28` | 24 WordPress-era SEO, trust, content, and UX tasks | Retain principles; replace obsolete implementation |
| Content Plan Y1 | `A1:J54` | Search-led calendar with 40 numbered pieces | Retire as production calendar |
| Content Plan Y2 | `A1:J104` | Search-led calendar with 88 numbered pieces | Retire as production calendar |
| Keyword Research | `A1:G74` | Estimated volume and difficulty values derived from unspecified “SEMrush/Ahrefs patterns” | Treat every row as unverified |
| Gap & Pivot Analysis | `A1:F33` | VPS/Linux/self-hosting/AI expansion ideas and monetization assertions | Retain only as optional technical experiment prompts |
| Monetisation Map | `A3:G34` | Text commission estimates, ad RPMs, sponsorship expectations, and revenue targets | Retire projections; revalidate every live program |
| Competitor Matrix | `A3:H21` | Estimated authority/traffic and “outpublish” opportunities | Retire as competitive evidence; rebuild from sourced current research when needed |

## Internal consistency findings

These are workbook defects, not disagreements with the new strategy:

1. The Master Index describes a “200+ Content Plan.”
2. Year 1 is labelled “Target: 120 Pieces,” but contains 40 numbered article entries.
3. Year 2 is labelled “Target: 120+ Pieces + Refreshes,” but contains 88 numbered entries, from 41 through 128.
4. The combined numbered plan therefore contains 128 entries, not 200+, 240, or 240+.
5. The Year 1 preamble also says three to five articles per month after cleanup; its listed September-to-May calendar contains 40 pieces, which is consistent with roughly four to five per active month but not with the 120-piece title.
6. Keyword volumes, difficulty, competitor traffic, domain-rating values, market-growth claims, affiliate commissions, cookies, RPMs, and revenue targets are stored as text without source URLs, retrieval dates, formulas, or confidence ranges.
7. Every Fix Tracker row is marked “To Do”; every content-calendar row is marked “Planned.” The workbook records intentions, not completed work or measured outcomes.
8. The projected monthly revenue values have no visible traffic, click-through, conversion, commission, approval, churn, geography, or cost assumptions. They cannot be treated as forecasts.

## Current SEO corrections

### E-E-A-T is not a checklist or compliance badge

The workbook repeatedly describes an About page, byline, schema, or affiliate approval as “E-E-A-T compliance.” Accurate identity, authorship, sourcing, and first-hand work are valuable trust evidence, but Google states that E-E-A-T itself is not a specific ranking factor. The rebuilt site should show real authorship because it helps readers and search systems understand who did the work—not because adding a profile mechanically restores rankings.

Source: [Google people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

### FAQ and HowTo rich-result promises are obsolete

The workbook promises HowTo and FAQ rich results as outcomes of adding schema. Google deprecated HowTo rich results and generally limits FAQ rich results to authoritative government and health sites. Valid structured data can still describe content, but these visual outcomes must not appear in the business case.

Source: [Google's HowTo and FAQ changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes).

### Volume is not the content strategy

Google's people-first questions explicitly warn about producing many topics mainly to attract search visits, entering niches without real expertise, chasing trends for their own sake, and changing dates without substantial updates. The workbook's 128-topic queue spans hosting, Linux administration, security, mail servers, programming languages, DevOps, home labs, privacy tools, local AI, careers, and product reviews. That breadth is not automatically spam, but it is incompatible with a credible small founder-led publication unless each piece has real expertise, original evidence, and maintenance capacity.

Google's spam policies separately define scaled-content abuse around large amounts of low-value or unoriginal content. The safeguard is not an arbitrary lower word count or slower cadence; it is a clear audience purpose and demonstrable additional value.

Sources: [Google people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies#scaled-content-abuse).

### Affiliate content requires original value

The workbook treats many provider review and comparison pages as standalone affiliate revenue streams before recording access to the products, test methods, costs, results, disclosures, or maintenance ownership. Google distinguishes useful affiliate pages by meaningful original information, rigorous testing, ratings, navigation, or comparison value. Paid and affiliate links also need appropriate link qualification.

No “best,” review, benchmark, or comparison page should be approved unless Harkingbade can show what was used, how it was evaluated, the relevant constraints, who performed the work, when prices/results were checked, how conflicts are disclosed, and how the page will be maintained.

Source: [Google spam policies: thin affiliation and paid links](https://developers.google.com/search/docs/essentials/spam-policies#thin-affiliation).

### Authorship remains a real launch gap

Google recommends accurate bylines and author markup that identifies a Person or Organization and links to a URL that uniquely identifies the author. The implemented site correctly avoids inventing a founder identity, but the current organization-level placeholder is not the final personal-brand state. A founder-approved name, profile URL, background, and claim evidence are still required.

Source: [Google Article structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/article#author-markup-best-practices).

## Retain, revise, retire

| Workbook idea | Decision | New rule |
|---|---|---|
| Correct brand spelling and broken links | Retain | Enforce through build checks and release QA rather than WordPress plugins |
| About page, real identity, bylines, disclosures | Retain | Add only verified founder information and claim evidence |
| Remove or review unsafe, obsolete, and off-purpose legacy pages | Retain | Use the evidence importer and URL ledger; no automatic dispositions |
| Consolidate duplicate intent | Retain | 301 only when a close replacement satisfies the old intent |
| Redirect removed pages to `/blog/` | Retire | Return 404/410 when no close replacement exists; avoid irrelevant soft-404 redirects |
| Internal-link maps and clear hubs | Revise | Link by reader journey and 4D stage, not an imposed VPS silo |
| Useful Resources and newsletter proposition | Retain | Lead with original tools such as the 4D Diagnostic and an explicit subscriber contract |
| Original benchmark or research assets | Retain | Publish only with reproducible data, methodology, dates, and limitations |
| 128-piece search calendar | Retire | Use an evidence gate and capacity ceiling, not a keyword quota |
| Estimated keyword volume/difficulty | Revise | Re-export current first-party and paid-tool data; keep source URL/export date and confidence |
| “Outpublish” competitors | Retire | Compete through first-hand proof, integrated judgment, usefulness, and distinctive artifacts |
| VPS/Linux as the primary brand | Retire | Technical delivery belongs under Build/Lab when it proves the founder's actual work |
| AI/local-LLM trend pivot | Revise | Test only when it serves the chosen audience and can produce original work—not because volume is rising |
| Affiliate reviews and comparisons | Revise | Require product access, methodology, evidence, disclosure, maintenance, and qualified links |
| Ads as a recovery target | Revise | Optional late-stage yield after a useful audience and direct opportunity system exist |
| Newsletter sponsorship projections | Retire | Validate engagement, buyer fit, inventory, and sponsor demand before forecasting |
| Digital guides/checklists | Retain | Build only from repeated reader/client demand and test free value before paid packaging |
| WordPress/Rank Math/Yoast steps | Retire | Astro templates, content schemas, build verification, Worker controls, and Search Console replace them |

## Topic-rights policy

Harkingbade has permission to publish a technical topic only when at least one of these is true:

- The founder personally performed and can document the work.
- The page contains a reproducible test, benchmark, migration, prototype, or operating artifact.
- A qualified contributor is accurately identified and their role is disclosed.
- The topic directly helps the selected hiring or buyer audience make a product, positioning, delivery, or growth decision.

The page must also have a named maintenance owner and review trigger. High-risk security, infrastructure, privacy, financial, or legal instructions require proportionately stronger review.

This policy permits the existing Astro/Cloudflare migration note because it documents an actual build. It does not permit dozens of generic VPS reviews merely because the historical workbook estimated attractive keywords or commissions.

## Replacement content operating model

For the next 90 days, content earns a slot only when all six gates pass:

1. **Audience:** one chosen hiring, client, or builder audience has a real use for it.
2. **Evidence:** it contains first-hand work, original data, an artifact, or a clearly sourced expert decision.
3. **Differentiation:** it adds something the current result set does not already provide.
4. **Commercial route:** it has one honest next step—work, diagnostic, resource, reply, or subscription.
5. **Maintenance:** an owner and review/retire trigger exist.
6. **Measurement:** the intended reader outcome and decision threshold are defined before publication.

Capacity ceiling:

- One evidence-rich flagship every two weeks.
- One shorter field note, teardown, or lab update per week when useful.
- One original research or benchmark asset per quarter.
- Zero historical-tech articles approved solely from estimated keyword volume.

This is a maximum of roughly 18 public pieces in a fully active 90-day period, and fewer is acceptable. It deliberately prioritizes proof and opportunity creation over the old calendar's inventory growth.

## Replacement monetization order

| Order | Revenue mechanism | Why it comes here | Activation evidence |
|---:|---|---|---|
| 1 | Career opportunities | Highest near-term value from credible proof | Qualified hiring conversation and progression |
| 2 | Product & Growth Diagnostic | Fastest direct market validation | Paid or explicitly qualified pilot |
| 3 | Position-to-Launch / Conversion Sprint | Productized expertise after diagnosis | Scoped proposal, close, delivery result, margin |
| 4 | Fractional engagement | Recurring revenue after delivery fit | Repeat need, capacity, retention, outcome evidence |
| 5 | Owned newsletter and resources | Compounds trust and research access | Confirmed subscribers, replies, resource use, buyers |
| 6 | Template, workshop, or small product | Leverage from repeated problems | Waitlist/preorder, activation, completion, refund data |
| 7 | Select affiliate or sponsorship | Useful only in a trusted editorial context | Audience fit, original review evidence, disclosure, qualified link |
| 8 | Display advertising | Optional yield, not the operating model | Meaningful qualified attention and acceptable UX tradeoff |

No revenue number should enter a forecast until the workbook exposes its drivers: qualified traffic or audience, click rate, conversion, approval rate, payout, churn/refund, delivery cost, and confidence range.

## Legacy recovery use

The workbook may still help prioritize evidence review, but it cannot decide URL outcomes. Its proposed deletions, consolidations, and redirects should be joined to:

- Search Console clicks, impressions, queries, canonical and indexing evidence.
- Analytics engagement and conversion evidence.
- Backlink quality and referring-page evidence.
- Current legal, security, accuracy, and maintenance review.
- Archive content and the intended new audience.

The existing private evidence importer and disposition ledger remain authoritative. Until those inputs exist, every consequential legacy URL remains undecided.

## Final disposition

`harkingbade_strategy.xlsx` is superseded as a roadmap. It remains valuable as:

- a historical statement of the previous business model;
- a source of legacy URL and quality-review prompts;
- a backlog of technical experiment ideas that must pass the new topic-rights and evidence gates; and
- an example of why Harkingbade now separates estimates, hypotheses, implementation, and verified outcomes.

It must not be used to restore the old taxonomy, publish the 128-topic queue, make revenue claims, or approve affiliate pages without fresh evidence.
