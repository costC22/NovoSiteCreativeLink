# ByteStorm Tech

## Direction
The September 2026 global redesign is authorized by the user's request to
modernize the entire site. Preserve the original ByteStorm logo, product icons,
commercial scope, starting prices, contact channels and all privacy documents.

The visual direction uses the selected 12ui studio reference: a full-width
photographic opening, clear service hierarchy, early prices and real products.
The generated export contained fixed-coordinate/zoom layouts and invented copy.
Its composition was adapted to native responsive layouts and the existing routes,
rather than publishing scaled text, fictional metrics or placeholder actions.
The optional prototype assembly failed with a Windows fsync error after all four
reference pages had exported; none of its temporary runtime was shipped.

## Runtime Ownership
- `brand-tokens.css`: canonical colors, fonts, radius and scrollbar colors.
- `stitch-redesign.css`: complete public theme; replaces the old patch stack.
- `briefing.css`: established eight-step form geometry and field states.
- `briefing-brand.css`: maps the shared identity onto that form.
- `script.js`: common navigation, plan selection and contact feedback.
- `briefing.js` and `briefing-schema.js`: unchanged briefing behavior/constraints.
Legacy `styles.css` and `extension-privacy.css` remain in the repository for
historical compatibility but are no longer loaded by public pages.

## Identity
The home hero photo depicts website development on a desktop monitor and phone.
Do not restore the laptop/staircase photo; the user rejected its unclear relevance.
Use the detail crop at a maximum 627 CSS pixels, with lossless 627px and 1254px
image-set sources for normal and Retina displays. The charcoal wall is CSS;
do not stretch a low-resolution panorama across the entire viewport again.

Graphite header/footer, white and cool gray reading surfaces, cyan primary
actions, dark cyan text links. Product icon colors stay intact. No decorative
terminal windows, invented operational dashboards, social-proof badges,
glowing dots, or repeated developer-facing descriptions of how the UI works.

Use Inter/system sans for body text and Manrope for public headings. Inputs are
16px. Letter spacing is zero. Font sizes change at explicit breakpoints, never
by viewport-width scaling. Cards and controls use 6px radii; use unframed bands
for sections and rows for services. Desktop public content is bounded at 1248px.

## Content
Starter R$ 990, Business R$ 1.990 and Premium R$ 3.990 are starting prices per
website project, not monthly subscriptions. Systems and automations are quoted
separately. Do not invent discounts, installments, client counts or guarantees.

LiveFast and AbaNexo retain their official Chrome Web Store links. AI Detector
de Golpes remains in development. Do not reintroduce OneClick or TabFlow.
AbaNexo and AgentSpark privacy document contents and dates are unchanged.

## Navigation and Accessibility
The mobile navigation breakpoint is 1100px in both CSS and JavaScript.
The expanded menu is opaque and unblurred; Escape closes it and restores focus.
Tab cycles between the menu toggle and navigation links while expanded.
Active-page matching supports both .html and Netlify's pretty URLs.
Skip links lead to the main content. Native selects and dates remain canonical.

## Form Behavior
Contact submits to the existing /api/contact endpoint. Script-owned validation
associates inline errors to fields and focuses the first invalid field. Pending
submissions disable controls and prevent duplicates. The success message requires
an explicit server ok:true response. Failures preserve answers. Timeout feedback
states that delivery is uncertain and asks the visitor to confirm before retrying.
Feedback is persistent, not an expiring toast.

The eight-step briefing keeps its schema, private upload handling, server receipt,
review, download and reset behavior. Do not persist lead data in browser storage.
The redesign does not change APIs, server storage, CSP or abuse protection.
Native select/date popups intentionally follow the operating system.

## Verification
- `node --test tests/briefing.test.mjs`: 26 server/schema regression tests.
- `node tests/site-browser.mjs`: 22 pages at 1920, 1440, 1024, 390 and 320px;
  links, image decoding, overflow, menu and contact-state coverage.
- `node tests/briefing-browser.mjs`: eight steps, required fields, attachment
  rejection, successful attachment, retry, receipt, download and reset at
  1440, 390 and 320px using an in-memory local store.
- `node scripts/security-audit.mjs --check`: 16 static security checks.
- Premium strict static audit reports 57 findings in two known categories:
  external event listeners and externally styled textarea sizing are not resolved.
  Runtime tests exercise those controls; do not add inline handlers/styles to
  appease the scanner, as that would violate the CSP.
No real production contact or briefing is submitted by these tests.
