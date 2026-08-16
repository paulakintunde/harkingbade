# Harkingbade Performance Audit Status

Status: trace not run; Chrome DevTools MCP unavailable  
Updated: 2026-08-16

## Evidence boundary

No Lighthouse score, FCP, LCP, TBT, CLS, Speed Index, INP, or TTFB value is claimed for the current build. The required Chrome DevTools MCP tools (`navigate_page`, `performance_start_trace`, network inspection, and accessibility snapshot) are not configured in this workspace.

Static architecture, small bundles, cache headers, and a clean build are useful implementation signals. They are not substitutes for a cold-load trace, throttled lab measurement, accessibility inspection, or post-launch field data.

## Required tool configuration

Add the Chrome DevTools MCP server to the Codex MCP configuration:

```json
"chrome-devtools": {
  "type": "local",
  "command": ["npx", "-y", "chrome-devtools-mcp@latest"]
}
```

Restart or reconnect the workspace after configuration. Do not install or execute an unreviewed package in a production account context.

## Audit acceptance sequence

1. Run a cold-load performance trace for `/`, `/career/`, `/services/`, `/work/harkingbade-recovery/`, and `/resources/4d-diagnostic/` against the production-style local Worker.
2. Record FCP, LCP, TBT, CLS, Speed Index, and TTFB under consistent desktop and mobile conditions.
3. Inspect LCP breakdown, CLS culprits, render-blocking resources, document latency, and network dependency chains.
4. Inventory document, script, stylesheet, font, and image requests; verify transfer size and cache headers.
5. Capture an accessibility snapshot for headings, landmarks, accessible names, focus behavior, and duplicate IDs.
6. Fix only demonstrated issues and record before/after values under the same conditions.
7. Repeat on staging after deployment.
8. Use Cloudflare Web Analytics field data after production activation to validate real-user Core Web Vitals.

## Current non-trace evidence

- Astro static output with Worker-first execution limited to `/api/*`.
- No third-party font dependency.
- Versioned Astro assets use one-year immutable caching.
- Security headers, responsive layouts, reduced-motion handling, and semantic navigation are implemented.
- The exact 1200×630 social preview is generated at build time.
- Production build verification currently covers canonical metadata, internal links, social metadata, and true 404 behavior.

These checks reduce known risks but do not close the performance acceptance gate.
