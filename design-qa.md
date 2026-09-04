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

Production opening asset: `studio-wide.webp` (1942 x 809, 82,922 bytes).
Replaced on 2026-09-04 at the user's request: the laptop/staircase subject was
not relevant to the services. Only the hero image and its cache key changed.
Generated with the built-in image_gen tool, then encoded as WebP without
changing the composition. The generated source remains under the Codex image
output directory. Original logos/icons and all page behavior were not altered.

Image prompt:
Use case: photorealistic-natural.
Asset type: replacement wide website hero background, aspect ratio 2.4:1.
Primary request: replace an irrelevant laptop-with-staircase photo with a concrete, tasteful visual of website and software development for ByteStorm Tech. Generate a NEW photographic image, NOT a whole website.
Scene: refined real software development desk against a matte charcoal wall (#28292b). On the RIGHT half of the image, a single thin black DESKTOP monitor with a stand, a simple keyboard on the desk, and a smartphone standing next to the monitor. No laptop. The monitor's screen visibly shows a split workspace: a code editor with neatly indented small cyan/white/amber syntax on the left, and a clean responsive business website preview with white background, cyan accent, simple typography and a rectangular photograph on the right. The smartphone displays the same responsive website. This is an illustrative development workspace, not a branded product screenshot or a claim of a delivered client project. Small code and website content should be realistic, discreet and not the focal headline. Screen UI stays inside the devices, no floating UI.
Composition: wide landscape banner. Reserve the LEFT 53 percent as entirely clear matte charcoal wall for the existing webpage's white headline; no objects, no lights, no baked-in text on that area. Monitor occupies the rightmost 40 percent with its full screen visible, facing camera, slight natural perspective. The desk surface lies along bottom 15 percent, use restrained neutral textures. Keep monitor and phone readable at smaller display size.
Lighting: natural soft side light, neutral graphite desk/wall, clear crisp screens, physically realistic, professional editorial photography, no heavy haze.
Avoid: stairs, architecture scenes on screens, laptop, hands, people, logos, watermarks, headings or text outside devices, neon lighting, holograms, glowing orbs, charts claiming metrics, glass cards, gratuitous futuristic effects.
