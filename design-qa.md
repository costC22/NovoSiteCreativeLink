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

Previous opening asset: `studio-wide.webp` (1942 x 809, 82,922 bytes).
Replaced on 2026-09-04 at the user's request: the laptop/staircase subject was
not relevant to the services. Only the hero image and its cache key changed.
Generated with the built-in image_gen tool, then encoded as WebP without
changing the composition. The generated source remains under the Codex image
output directory. Original logos/icons and all page behavior were not altered.

Previous panorama prompt:
Use case: photorealistic-natural.
Asset type: replacement wide website hero background, aspect ratio 2.4:1.
Primary request: replace an irrelevant laptop-with-staircase photo with a concrete, tasteful visual of website and software development for ByteStorm Tech. Generate a NEW photographic image, NOT a whole website.
Scene: refined real software development desk against a matte charcoal wall (#28292b). On the RIGHT half of the image, a single thin black DESKTOP monitor with a stand, a simple keyboard on the desk, and a smartphone standing next to the monitor. No laptop. The monitor's screen visibly shows a split workspace: a code editor with neatly indented small cyan/white/amber syntax on the left, and a clean responsive business website preview with white background, cyan accent, simple typography and a rectangular photograph on the right. The smartphone displays the same responsive website. This is an illustrative development workspace, not a branded product screenshot or a claim of a delivered client project. Small code and website content should be realistic, discreet and not the focal headline. Screen UI stays inside the devices, no floating UI.
Composition: wide landscape banner. Reserve the LEFT 53 percent as entirely clear matte charcoal wall for the existing webpage's white headline; no objects, no lights, no baked-in text on that area. Monitor occupies the rightmost 40 percent with its full screen visible, facing camera, slight natural perspective. The desk surface lies along bottom 15 percent, use restrained neutral textures. Keep monitor and phone readable at smaller display size.
Lighting: natural soft side light, neutral graphite desk/wall, clear crisp screens, physically realistic, professional editorial photography, no heavy haze.
Avoid: stairs, architecture scenes on screens, laptop, hands, people, logos, watermarks, headings or text outside devices, neon lighting, holograms, glowing orbs, charts claiming metrics, glass cards, gratuitous futuristic effects.

## Image Quality Follow-up
The user reported low resolution. The final asset concentrates its native pixels
on the workstation instead of spending half the panorama on an empty wall.
The replacement is a built-in image_gen restoration, not a 4K original.
The earlier requested 4K generation returned 1942 x 809 and was not deployed.
Current assets: `studio-detail.webp` (627 x 627, 360,610 bytes) and
`studio-detail@2x.webp` (1254 x 1254, 1,372,368 bytes), both lossless WebP.
The full-density asset retains the generated PNG's pixels without resampling.
The photo is bounded at 627 CSS pixels and selected via image-set. Mobile uses
the smaller source: 627 pixels cover the 180 CSS pixel image even at 3x density.
The matte backdrop and the photo's responsive positioning are CSS-owned.
No text, links, pricing, products, forms or other sections changed.

`node tests/hero-image.mjs` verifies the selected file, sufficient physical pixels
and separation from the copy at 1440/1x, 1920/2x, 3840/1x, 1024/2x and 390/3x.
The normal site regression suite also passed 110 layout checks on 22 pages.

Final built-in image_gen prompt:
High-definition restoration of this software development workstation photograph, for the right-hand illustration of an existing website hero. Output SQUARE 1:1 at highest native resolution. This square crop is intentional so ALL available pixels depict the monitor and phone, not an empty wall. Keep the same black desktop monitor with code editor on left half and clean white/cyan website preview on right half, black keyboard and smartphone showing same site. Reconstruct small details sharply and naturally: website typography, code punctuation, screen bezels, stand, keyboard keys, phone silhouette. Entire monitor and phone and keyboard fully inside the frame with 6% clear margins. Monitor fills about 86% of width, centered; top edge around 15% down, keyboard at 83%, clear empty charcoal wall top margin. All text is confined to device screens. Keep the illustrative website, do not turn it into a different subject. Preserve neutral charcoal wall and desk (#28292b), with minimal lighting variation at outermost edges to blend into the site's flat charcoal background. No blur, no shallow depth of field, no JPEG artifacts, no neon, no glow, no new decorative items or fake metrics. Do not output a wide banner. Square, sharp photographic image only.
