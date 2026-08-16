# Harkingbade Founder Evidence Intake

Status: required before final identity, career, pricing, testimonial, and outcome copy  
Purpose: turn real work into credible proof without exaggeration

## Private evidence workflow

Use the versioned JSON intake when the evidence is ready. The source file and generated report stay in ignored private folders.

```powershell
New-Item -ItemType Directory -Force -Path data/private
Copy-Item -LiteralPath data/founder-evidence.example.json -Destination data/private/founder-evidence.json
npm.cmd run research:founder
```

The checker validates the contract, confirms that the four six-month priorities total 100, evaluates the identity/career/services/proof/positioning gates, and requires three complete project records explicitly approved for public use. Its default output is `docs/private/founder-evidence-readiness.md`.

The report contains only gate states, missing field paths, error messages, and the count of approved proof records. It does not repeat names, emails, role history, client details, or project claims from the source file. The command exits with code `2` when the structure is readable but the founder-copy gate is incomplete, and code `1` for an invalid file or command failure. Use `--allow-incomplete` only when intentionally generating a progress report.

Passing this checker does not publish anything or prove a claim independently. It means the supplied records contain the minimum fields required for human evidence review and founder approval.

## 1. Identity and market

- Public name and preferred professional title:
- Location and markets served:
- Preferred working arrangement: remote, hybrid, onsite, or flexible:
- Working currency: CAD, USD, or other:
- Public email:
- Resume/CV location:
- LinkedIn and other verified profiles:
- Professional photo and brand assets:
- Languages and work authorization details that should be public:

## 2. Six-month priority

Allocate 100 points across the four outcomes:

| Outcome | Points | Why now? | Evidence of success after six months |
|---|---:|---|---|
| Full-time role |  |  |  |
| Productized services/fractional work |  |  |  |
| Digital products/education |  |  |  |
| Publishing/advertising/affiliate revenue |  |  |  |

### Target roles

Choose and rank three:

1. Role:
   - Employer type:
   - Seniority:
   - Geography:
   - Why the evidence fits:
2. Role:
   - Employer type:
   - Seniority:
   - Geography:
   - Why the evidence fits:
3. Role:
   - Employer type:
   - Seniority:
   - Geography:
   - Why the evidence fits:

### Target clients

- Company stage and size:
- Industry or business model:
- Buyer title:
- Existing product/offer situation:
- Expensive problem they already recognize:
- Trigger that makes the problem urgent:
- Work they have already tried:
- Budget or buying pattern, if known:
- Clients or industries to exclude:

## 3. Project proof inventory

Complete one copy of this table per project. Prefer three strong projects over ten thin ones.

| Field | Evidence |
|---|---|
| Project and organization |  |
| Dates and your role |  |
| Customer/user |  |
| Starting situation |  |
| Consequence of the problem |  |
| Constraints |  |
| Research/evidence reviewed |  |
| Important decisions you owned |  |
| Work you personally produced |  |
| Collaborators and their contribution |  |
| Baseline measure |  |
| Result and measurement window |  |
| Data source |  |
| What did not work |  |
| What changed next |  |
| Screenshots/files/links |  |
| Testimonial/reference |  |
| Confidentiality limits |  |
| Claim allowed publicly |  |

### Evidence hierarchy

Prefer, in order:

1. Auditable business/product analytics or financial evidence.
2. Attributable customer, manager, or collaborator confirmation.
3. Dated artifacts showing the decision and work.
4. Public launch/repository/page evidence.
5. Founder recollection clearly labelled as reported rather than verified.

## 4. Capability map

Classify every skill as a lead capability, supporting capability, learning capability, or work not for sale.

| Capability | Classification | Strongest proof | Desired role/client use | Publish publicly? |
|---|---|---|---|---|
| Product management |  |  |  |  |
| Customer research |  |  |  |  |
| Product strategy |  |  |  |  |
| Product marketing |  |  |  |  |
| Brand positioning |  |  |  |  |
| Content strategy/writing |  |  |  |  |
| Social distribution |  |  |  |  |
| SEO |  |  |  |  |
| Web development |  |  |  |  |
| Ecommerce |  |  |  |  |
| Analytics/experimentation |  |  |  |  |
| Operations/automation |  |  |  |  |
| Other |  |  |  |  |

## 5. Historical traffic and monetization evidence

Collect exports rather than screenshots where possible:

- Search Console performance for the longest available period.
- Search Console pages, queries, countries, devices, search appearance, and search type.
- Indexing, sitemaps, crawl statistics, security issues, and manual actions.
- GA/GA4 acquisition and landing-page history.
- AdSense approval, policy, revenue, and page/channel history.
- Registrar, DNS, Cloudflare zone, certificates, and hosting timeline.
- WordPress database, uploads, sitemaps, redirects, and plugin list.
- Backlink export and historical top-linked pages.
- Site-move, redesign, domain, protocol, host, or permalink changes.
- Security incidents, malware, hacked pages, manual actions, or policy notices.
- Approximate date and shape of the traffic decline.

## 6. Commercial constraints

- Hours available per week:
- Cash budget for the first 90 days:
- Minimum acceptable engagement value:
- Delivery work you enjoy:
- Delivery work you do not want:
- Maximum simultaneous clients:
- Communication and meeting preferences:
- Industries, products, or tactics you will not support:
- Legal/business entity and invoicing status:
- Existing contracts or intellectual-property restrictions:

## Evidence approval rule

No result becomes public copy until its owner, data source, time window, contribution boundary, and confidentiality status are known. When verification is impossible, phrase it as a report or working estimate rather than a fact.
