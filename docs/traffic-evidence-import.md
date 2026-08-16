# Private Traffic Evidence Import

Status: importer implemented; founder exports not yet supplied  
Privacy: generated evidence stays under ignored `data/private/` and `docs/private/`

## Purpose

The public archive proves which URLs existed, but not which URLs earned clicks, revenue, conversions, or links. This importer joins untouched platform exports to the 737-path archive inventory and creates a prioritized human review queue.

It never edits `public/_redirects` and never turns a score into a KEEP, 301, 404, 410, or REVIEW decision. Only a validated manual-review row can assign a disposition.

## Export the evidence

Export CSV files without renaming or deleting columns:

1. **Search Console:** Performance > Search results > Pages. Export the longest comparable period available, plus a recent period if possible. Required fields: page/URL and at least clicks or impressions.
2. **GA/GA4:** landing-page report. Required fields: landing page and at least sessions; include engaged sessions, conversions/key events, and revenue where available.
3. **Backlink tool:** target-URL report. Required fields: target URL and backlinks or referring domains.
4. **AdSense:** URL/channel performance if available. Required fields: URL and earnings, page views, or clicks.
5. **Manual review:** optional CSV using the contract below.

Keep each original export unchanged. Record its platform, property/account, date range, timezone, filters, export date, and owner separately.

## Manual review contract

Accepted columns:

| Column | Required | Rule |
|---|---|---|
| `legacy_path` or `old_url` | yes | Full Harkingbade URL or path |
| `decision` | when decided | `KEEP`, `301`, `404`, `410`, `REVIEW`, or `UNDECIDED` |
| `destination` | for 301 | Close, intent-matched target path |
| `decision_reason` | when decided | Evidence-based explanation |
| `owner` | when decided | Person accountable for the decision |
| `verified_at` | when decided | `YYYY-MM-DD` |
| `manual_action` | optional | `yes/no` or `true/false` |
| `security_issue` | optional | `yes/no` or `true/false` |
| `legal_risk` | optional | `yes/no` or `true/false` |
| `current_intent` | optional | Current user need |
| `notes` | optional | Review context |

The importer refuses incomplete decisions. A 301 without a destination, reason, owner, or verified date cannot enter the evidence output.

## Run the import

Use only the sources available; at least one is required:

```sh
npm run research:evidence -- \
  --gsc "path/to/search-console-pages.csv" \
  --ga4 "path/to/ga4-landing-pages.csv" \
  --backlinks "path/to/backlinks.csv" \
  --adsense "path/to/adsense.csv" \
  --manual "path/to/manual-review.csv"
```

Default private outputs:

- `data/private/legacy-evidence.json` — complete machine-readable evidence.
- `docs/private/legacy-evidence-report.md` — source coverage, queues, and top-evidence paths.

## Review score

The transparent score prioritizes human attention:

| Signal | Points |
|---|---:|
| Current Search Console clicks | 25 |
| Current Search Console impressions | 10 |
| Analytics sessions | 20 |
| Conversions or analytics revenue | 15 |
| AdSense revenue | 10 |
| Backlinks or referring domains | 20 |

Risk-language, manual-action, security, or legal flags always enter `RISK_REVIEW`, regardless of score. Scores do not prove quality, relevance, legality, or redirect intent.

## Evidence limitations

- Different date ranges must not be compared without normalization.
- GA and Search Console measure different systems and will not reconcile exactly.
- URL parameters, protocol, and host variants are normalized to a canonical path for triage, while original exports remain untouched.
- “No signal” can mean missing coverage, expired retention, tracking failure, or genuinely low value. It is not automatic deletion evidence.
- Historical revenue and traffic must be labelled with their source and time window before they become public case-study claims.
