# Harkingbade Field Note Launch Kit

Status: copy and operating rules ready; provider, sending identity, authenticated domain, and live links pending verification  
Owner: founder  
Last updated: 2026-08-16

## Purpose

The Field Note turns useful product-and-growth thinking into an owned relationship. It is not a traffic recap or a generic marketing newsletter. Every issue should help a reader make one clearer decision and create a natural route to a resource, a conversation, or a relevant engagement.

## Launch gate

Do not enable the public signup until all of these are true:

- The sender name and reply-to inbox are founder-approved and monitored.
- SPF, DKIM, and DMARC are verified for the selected sending domain.
- The newsletter webhook preserves `consentVersion`, `consentedAt`, `source`, and `requestId`.
- Confirmed opt-in is enabled where required or chosen.
- Unsubscribe works in one step and adds the address to a durable suppression list.
- A test signup, confirmation, all three welcome messages, reply, unsubscribe, and resubscribe policy have been checked with controlled inboxes.
- The privacy policy names the provider and describes material retention or data-location behaviour.
- `PUBLIC_NEWSLETTER_ENABLED=true` is set only for the approved release build.

## Subscriber contract

Promise: one concise, evidence-led note about a real product, positioning, delivery, or growth decision.

Cadence: no more than one regular issue per week during the first 90 days. Operational notices and confirmed-opt-in messages do not count as regular issues.

Each message must include:

- One specific decision or tension.
- One useful model, example, or action.
- One primary call to action.
- A monitored reply address.
- The sender's postal or legally required business identification once confirmed.
- The provider's working unsubscribe link.

Never place the subscriber's email address, name, or other personal data in UTM parameters or analytics properties.

## Provider fields

Map the Worker payload without discarding consent evidence:

| Worker field | Provider destination | Rule |
|---|---|---|
| `email` | Subscriber email | Never log or place in tracking links |
| `list` | `harkingbade-field-note` audience/tag | Keep separate from contact leads |
| `source` | Signup source custom field | Normalize to a site path before analysis |
| `consentVersion` | Consent-version custom field | Immutable for the subscription request |
| `consentedAt` | Consent timestamp | Store in UTC |
| `requestId` | Idempotency/audit field | Deduplicate repeated webhook delivery |

The receiving automation should return a non-2xx response when it cannot durably record the request. A `2xx` response must mean the provider or queue has accepted responsibility for delivery.

## Link convention

Use lowercase, stable campaign values:

```text
utm_source=field-note
utm_medium=email
utm_campaign=welcome
utm_content=email-1-primary
```

For regular issues, use `utm_campaign=field-note-YYYY-MM-DD` and a descriptive `utm_content` such as `primary-diagnostic` or `secondary-case-study`.

## Welcome sequence

The provider's confirmation message comes first. Welcome Email 1 begins only after confirmed subscription when confirmed opt-in is enabled.

### Email 1 — Make the constraint visible

Timing: immediately after confirmed subscription  
Subject A: `Start here: find the constraint`  
Subject B: `A 5-minute Product & Growth check`  
Preview: `Four stages. Sixteen statements. One clearer place to begin.`

```text
Thanks for joining the Harkingbade Field Note.

The premise is simple: product, positioning, delivery, and growth work better as one learning loop.

The free 4D Diagnostic helps you inspect that loop across four stages:

Discover — what do we actually know?
Define — what decision and promise are we making?
Deliver — can people experience the value?
Drive — are we learning from real behaviour?

It takes about five minutes. Your answers stay in your browser.

Take the 4D Diagnostic:
https://harkingbade.com/resources/4d-diagnostic/?utm_source=field-note&utm_medium=email&utm_campaign=welcome&utm_content=email-1-primary

If you reply, tell me which stage came out weakest. That answer will help shape future notes.

— Harkingbade

You requested the Harkingbade Field Note. Unsubscribe: {{ unsubscribe_url }}
```

Success signal: diagnostic completion or a substantive reply.  
Do not optimize for: opens alone.

### Email 2 — Repair the handoff

Timing: two days after Email 1  
Subject A: `Where good work usually breaks`  
Subject B: `The handoff is part of the product`  
Preview: `A useful product can still fail between insight, promise, experience, and learning.`

```text
A team can do strong research, thoughtful branding, clean development, and disciplined marketing—and still underperform.

The usual failure is not a lack of effort. It is a broken handoff:

Research does not change the decision.
The decision does not sharpen the promise.
The promise does not survive the experience.
Behaviour does not update the next decision.

That is why Harkingbade uses one loop: Discover, Define, Deliver, Drive.

Read the working model:
https://harkingbade.com/insights/why-product-brand-and-growth-break/?utm_source=field-note&utm_medium=email&utm_campaign=welcome&utm_content=email-2-primary

Try this today: name one piece of evidence that should change your next product or growth decision. If no one can name it, the learning loop is probably the first constraint.

— Harkingbade

You requested the Harkingbade Field Note. Unsubscribe: {{ unsubscribe_url }}
```

Success signal: article visit followed by a return visit, resource use, or reply.

### Email 3 — From diagnosis to a bounded decision

Timing: four days after Email 2  
Subject A: `What useful help should produce`  
Subject B: `Start with the decision, not the task list`  
Preview: `A good engagement should reduce uncertainty and leave an executable next step.`

```text
Cross-functional problems often arrive as a list of tasks:

Rewrite the page.
Fix conversion.
Build the feature.
Publish more content.

But a task list can hide the actual constraint.

Harkingbade starts with a bounded decision: what evidence matters, what must become clearer, what will be changed, and how we will know whether it helped.

The current recovery project shows that method in public—including what is not yet proven:
https://harkingbade.com/work/harkingbade-recovery/?utm_source=field-note&utm_medium=email&utm_campaign=welcome&utm_content=email-3-primary

If you are working through a product, launch, conversion, or cross-functional growth problem, you can share the context here:
https://harkingbade.com/contact/?interest=diagnostic&utm_source=field-note&utm_medium=email&utm_campaign=welcome&utm_content=email-3-secondary

No generic pitch is required. A useful brief starts with what is happening, the available evidence, and the decision that cannot stay unclear.

— Harkingbade

You requested the Harkingbade Field Note. Unsubscribe: {{ unsubscribe_url }}
```

Success signal: qualified contact, career conversation, or reply with a real decision context.

## Field Note 001

Working title: `Traffic is an input, not the business`  
Primary audience: founders, product leaders, and lean cross-functional teams  
Primary CTA: 4D Diagnostic  
Evidence rule: do not publish historical traffic numbers until founder-owned analytics supports the claim.

Subject A: `Traffic is not the operating system`  
Subject B: `What has to work before traffic returns`  
Preview: `A recovery plan built around qualified opportunities, not pageviews alone.`

```text
When a site loses visibility, the obvious goal is to get the traffic back.

That goal is incomplete.

Traffic can amplify a working system, but it cannot repair an unclear audience, a weak promise, missing proof, a leaking journey, or an offer no one has validated.

The stronger recovery question is:

What owned system should exist before attention returns?

For Harkingbade, the answer has four parts:

1. Discover the evidence behind the decline and the audience worth serving.
2. Define a coherent position, offer, and decision path.
3. Deliver a fast, crawlable, trustworthy experience.
4. Drive a learning loop around qualified opportunities—not pageviews alone.

That changes the order of work. Reliability and measurement come before content volume. Proof comes before inflated claims. Services can validate demand before products scale. Search becomes one acquisition channel, not the whole business.

Use the 4D Diagnostic to find the weakest part of your own loop:
https://harkingbade.com/resources/4d-diagnostic/?utm_source=field-note&utm_medium=email&utm_campaign=field-note-001&utm_content=primary-diagnostic

Reply question: if your traffic doubled next month, which part of your system would break first?

— Harkingbade

You requested the Harkingbade Field Note. Unsubscribe: {{ unsubscribe_url }}
```

## First six regular issues

| Issue | Decision tension | Primary route | Commercial learning |
|---|---|---|---|
| 001 | Traffic versus a functioning opportunity system | 4D Diagnostic | Which stage readers identify as weakest |
| 002 | Positioning breadth versus buyer clarity | Services diagnostic | Which audience/problem language earns replies |
| 003 | Research activity versus decision evidence | Decision Canvas | Whether the resource creates repeat use |
| 004 | Launch output versus learning design | Position-to-Launch Sprint | Whether launch constraints generate qualified briefs |
| 005 | Conversion tactics versus journey diagnosis | Conversion Sprint | Which leak categories recur |
| 006 | Cross-functional coverage versus accountable ownership | Fractional engagement | Whether lean teams value integrated ownership |

## 30-day decision rules

Review weekly, but do not draw a commercial conclusion from opens alone.

- Continue the sequence when delivery, unsubscribe, complaint, and reply behaviour are healthy and the notes generate diagnostic use, replies, return visits, or qualified opportunities.
- Revise the promise or Email 1 when confirmed subscribers do not use the diagnostic or reply after a meaningful sample.
- Revise topic and CTA alignment when clicks occur without useful downstream action.
- Pause acquisition immediately for broken unsubscribe, unexplained complaint spikes, consent-record loss, provider abuse warnings, or delivery that cannot be audited.
- Do not increase frequency to compensate for weak relevance.

## Launch evidence record

Complete this table before changing the public feature flag:

| Gate | Evidence location | Owner | Status |
|---|---|---|---|
| Sender identity approved |  |  | Pending |
| SPF/DKIM/DMARC verified |  |  | Pending |
| Webhook accepts and deduplicates |  |  | Pending |
| Consent fields preserved |  |  | Pending |
| Confirmation tested |  |  | Pending |
| Three-message sequence tested |  |  | Pending |
| Reply inbox monitored |  |  | Pending |
| Unsubscribe and suppression tested |  |  | Pending |
| Privacy policy names provider |  |  | Pending |
| Controlled-inbox smoke passes |  |  | Pending |
| Public launch flag approved |  |  | Pending |
