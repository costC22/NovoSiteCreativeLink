# ByteStorm Tech

## Overview
The public site uses the approved Stitch theme. The briefing is a task-focused,
eight-step variant of the existing contact workflow, based on the supplied
`briefing_bytestorm_moderno.html`. Preserve its questions and step order.

## Colors
`stitch-redesign.css` owns the public theme. The briefing adapts its existing
CSS variables to the same near-black surfaces, cyan action color, green success
and red error accents without changing other pages.

## Typography
Inter/system sans for forms; Manrope for the public site headings. Portuguese
(Brazil), readable 16px inputs, zero letter spacing. Native selects and date
inputs retain platform keyboard and mobile behavior.

## Layout
Keep the supplied sidebar and eight-step form. At narrow widths the sidebar
becomes a compact brand/navigation row; the form uses one column. Document
scrolling owns the form; only the stepper may scroll horizontally.

## Components
- `briefing.css`: isolated form styles; no changes to shared card or list rules.
- `briefing.js`: inline validation, first-error focus, step navigation, review,
  upload feedback, failure recovery and explicit receipt confirmation.
- `briefing-schema.js`: shared field and attachment constraints for client/API.
- `/api/briefing`: validates and stores submissions privately in Netlify Blobs.
- Contact forms remain on `/api/contact`; they are not converted to briefings.

## Do's and Don'ts
Use native semantic controls, visible focus and persistent error messages.
Preserve answers after a failed send; never show success without a server receipt.
Do not save personal answers in persistent browser storage. Keep answers in the
current tab until submission or explicit download. Uploaded files are private
attachments, never public assets and never executed by the server.

## Verification
Native select/date popups intentionally use the operating system UI. Vanilla
event listeners in `briefing.js` own buttons; inline handlers are prohibited by
CSP. Textarea sizing is owned by `briefing.css` (`resize: none`, bounded content
growth). The generic premium static audit does not resolve external listeners or
CSS, so its actionless-button/textarea findings require runtime review, not
inline handlers or style attributes. `tests/briefing-browser.mjs` exercises all
eight steps, errors, attachment selection, retry, receipt, download and reset at
1440, 390 and 320px. The existing public-page styling remains out of scope.
