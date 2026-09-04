# Global Redesign QA

Updated: 2026-09-04.

## Scope
All 22 public content/form pages use the new identity. Prices, installation URLs,
contacts, product statuses, privacy text and the eight-step briefing are retained.
Google Search Console verification and server-side protections are unchanged.

## Evidence
Local screenshots and the 110-layout-check report are in `test-results/site/`.
Briefing workflow screenshots are in `test-results/briefing/`.
These artifacts and tests are excluded from Netlify publication.
The security scanner is a regression check, not a claim of immunity to attacks.

## Visual References and Asset
12ui draft reference: candidate A, run
`12ui-redesign-bytestorm-tech-a-z5rCF0`. Branch export:
`../bytestorm-design-final/branch/pages/`.
The working website retains its own routes and API handlers.

Production opening asset: `studio-wide.webp` (1942 x 809, 98,424 bytes).
Generated with the built-in image_gen tool, then converted to WebP without
changing its composition. The generated source remains under the Codex image
output directory. Original logos/icons were not altered.

Image prompt:
Create one refined photographic website background asset for ByteStorm Tech, a
Brazilian independent web development and automation studio. Ultra-wide landscape.
The left 55% is uninterrupted naturally lit charcoal plaster wall and dark desk,
quiet negative space for HTML text. On the right, a black laptop fully in frame
with a crisp architectural photograph of pale concrete stairs on its screen.
No text, logos, fake headlines, code, charts, people, neon, particles or dashboards.
Restrained natural daylight, legible materials and delicate shadows.
Only the photograph, no website panels, navigation, cards or buttons.
