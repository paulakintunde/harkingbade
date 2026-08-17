# Harkingbade CSS and Structure Reset

Status: planning baseline — no production content migration yet.

## 1. What is being removed

- The current page-by-page visual language: mixed editorial serif headings, rounded cards, grid-paper backgrounds, lime/coral/blue accents, and local styles that disagree about spacing and hierarchy.
- The current homepage narrative and all placeholder service claims. Content will be replaced with short, neutral labels until the offer structure is agreed.
- The current “everything is equally important” navigation. Work, services, insights, lab, resources, newsletter, and career will not all compete in the first viewport.
- Decorative motion that is not tied to an interaction or product idea.

The URL and SEO preservation work stays in place. This is a visual and information-architecture reset, not a destructive URL reset.

## 2. Reference patterns to adapt

TAMradar is useful for product presence: one clear promise, a live signal/status strip, a concrete “how it works” sequence, and a visual feed that makes the product feel active. Reference: https://www.tamradar.com/

Eleken is useful for commercial structure: service categories, case-study proof, process detail, fit qualification, and repeated but consistent calls to action. Reference: https://www.eleken.co/

Harkingbade should combine those patterns with a personal-builder point of view. We will not copy their logos, copy, illustrations, colors, or layouts.

## 3. New page architecture

### Primary navigation

1. **Home** — one promise, one motion system, one proof path.
2. **Solutions** — short placeholder cards grouped by buyer situation, not skill category.
3. **Proof** — case studies and experiments with a consistent evidence template.
4. **Lab** — tools, Remotion compositions, prototypes, and public experiments.
5. **About** — capabilities, working principles, and career/fractional path.

The header has one primary action: **Start a project**. Newsletter, RSS, legal pages, and the career profile move to the footer or About page until their content is ready.

### Homepage skeleton

1. **Signal hero** — short placeholder headline, one sentence, one CTA, one Remotion signal animation.
2. **Choose a route** — four compact buyer cards: property, commerce, product teams, hiring/collaboration.
3. **Proof rail** — one case placeholder, one metric/evidence placeholder, one “what is still unknown” marker.
4. **Working method** — four steps: Notice, Shape, Make, Move.
5. **Selected experiments** — three compact Lab items, no long articles.
6. **Closing CTA** — one action and one sentence.

### Template skeletons

- **Solutions detail:** problem → fit → deliverable → process → proof placeholder → CTA.
- **Proof detail:** context → constraint → decision → artifacts → evidence → next question.
- **Lab detail:** hypothesis → interactive/motion artifact → observation → next iteration.
- **About:** point of view → capability clusters → selected proof → contact.

## 4. CSS system to rebuild

### Tokens

Use one token file and no page-specific color values:

- `--color-ink`: near-black blue/charcoal.
- `--color-paper`: warm off-white.
- `--color-signal`: acid lime for active states.
- `--color-alert`: orange/coral for change and attention.
- `--color-link`: electric blue for links and focus states.
- `--space-1` through `--space-8`: a fixed spacing scale.
- `--container`: one max-width; `--gutter`: one responsive gutter.
- `--radius-sm` only for controls; no default rounded cards.
- `--shadow-1` only for floating controls; no blanket card shadows.

### Layout rules

- Desktop uses a 12-column grid; mobile collapses to one column with explicit order.
- Every section gets one alignment edge. No independently centered headings beside arbitrary cards.
- Content widths are intentional: 70–75rem shell, 42–48rem reading measure, 24–28rem supporting measure.
- Cards are rectangular panels with a clear border and one hierarchy. Bento layouts are reserved for proof or tools, not every section.
- Full-bleed dark sections alternate with light sections only when the content role changes.

### Typography

- One display family for hero and section titles.
- One neutral sans for body and controls.
- One mono label style for system metadata, status, and motion annotations.
- No serif italics for emphasis in the first reset. Emphasis uses color, weight, or a signal underline.
- Text is capped by role: hero, section, card, metadata. No global heading size is reused blindly.

### Components

Rebuild the shared layer before pages:

`SiteHeader`, `MobileMenu`, `SignalLabel`, `Button`, `SectionIntro`, `RouteCard`, `ProofCard`, `ProcessRail`, `MotionFrame`, `SiteFooter`.

Each component owns spacing only inside itself. Pages compose components; pages do not redefine their internals.

## 5. Motion system

Motion has three layers:

1. **CSS interaction motion:** hover, focus, menu open/close, card reveal. Must respect `prefers-reduced-motion`.
2. **Astro/browser motion:** lightweight entrance and scroll reveals using progressive enhancement only; the content must work with JavaScript disabled.
3. **Remotion compositions:** branded signal feeds, case-study transitions, product/video previews, and future client deliverables.

Remotion rules:

- Drive frames with `useCurrentFrame()` and `interpolate()`; do not use CSS transitions inside compositions.
- Keep compositions parameterized by title, labels, colors, and asset URLs.
- Keep rendered media optional. The Astro page must have a static fallback when no MP4/WebM is present.
- Start with `OpportunitySignal`; add `CaseStudyReveal` and `PropertyStoryPreview` only after the first visual direction is approved.
- Render outside the Cloudflare build unless a stable rendering environment is explicitly added. Cloudflare should serve finished assets, not launch a headless browser during every deploy.

## 6. Placeholder-content rules

Until the content structure is approved:

- Use labels such as “Solution placeholder,” “Proof placeholder,” and “Motion experiment.”
- Do not publish unsupported metrics, prices, client names, testimonials, or performance claims.
- Keep each page to one promise, three supporting points, and one CTA.
- Avoid filling empty sections with generic paragraphs. Empty is better than cut-and-join copy.

## 7. Implementation order

1. Freeze the current branch as the visual reset baseline.
2. Replace `global.css` with tokens, grid, typography, controls, and motion primitives.
3. Rebuild `Header`, `MobileMenu`, `Footer`, and `BaseLayout`.
4. Rebuild the homepage from the new skeleton using placeholder content only.
5. Rebuild Solutions, Proof, Lab, and About templates.
6. Move old articles and resources behind the new templates without rewriting their URLs.
7. Add Remotion `CaseStudyReveal` after the hero motion is approved.
8. Run desktop/mobile visual QA, keyboard/focus QA, reduced-motion QA, Astro diagnostics, tests, and build-size checks.
9. Deploy to staging for review. Production remains untouched until the visual reset is accepted.

## 8. Definition of done for the reset

- Every page uses the same tokens, container, typography roles, and button system.
- The homepage can be understood without reading a long paragraph.
- Navigation tells users where to go by intent, not by the creator’s internal categories.
- No unsupported claims or stale placeholder content remain in the first viewport.
- Motion has a purpose, a static fallback, and reduced-motion behavior.
- Desktop and mobile layouts are intentionally composed, not merely stacked.
- Existing SEO, sitemap, Worker routes, and legacy URL decisions remain intact.
