# Shared CSS audit - 6 November 2026

**Subsequent owner instruction:** HELP is now independent again. Its styles, script and media are all inside `help/`, and no HELP rules remain in the main stylesheet. Nine Dave Drums pages share `assets/styles.css`. The report below records the earlier audit before that separation and the later Watch edits.

This maintenance refactor uses the existing working tree, including the Watch and notation work, as its visual reference. All changes remain local.

## Coverage and ownership

All ten HTML pages now load only `assets/styles.css`, with no authored style blocks or inline style attributes:

- Home, Lessons, Recording and Recording Terms.
- Metronome, Groove Lab, Watch and Drone notation.
- The root-relative 404 document and the HELP band landing page.

The nine Dave Drums pages share Inter headings, DM Sans reading/interface text, typography and spacing tokens, charcoal/paper/blue themes, navigation, footer, action and form components. Page-specific compositions, crops, heading scales and responsive layouts remain where the design requires them.

At the user's request, HELP retains its orange palette, monospace typography, warning, video background and audio controls. Its former inline CSS is now the scoped `.help-page` section of the shared stylesheet, using local theme overrides and the existing resets. Its script moved to `assets/help.js`; it also handles audio failure that occurred before the external script finished loading.

The metronome's independently hosted Shadow DOM application and the cross-origin Groove Lab, Soundslice, YouTube and Instagram frames retain their own internal styling. The shared stylesheet owns the surrounding page, controls and player containers.

## Shared and removed

- Consolidated duplicate service-summary, service-fact, navigation panel, caret and Contact rules. Service introductions/details now live together under shared components.
- Reused shared full-bleed image sizing while preserving individual focal points.
- Consolidated responsive scopes and removed repeated inherited declarations, superseded phone overrides and redundant resets.
- Centralised repeated spacing, blue surfaces, form colours, review-star colour, compact text sizes and font weights. Medium (500) and semibold (600) now have distinct tokens; existing computed weights are preserved.
- Removed 36 obsolete selector branches after checking every template, script and generator. These include removed hero captions/intro text, the old About principle/icon note, the duplicate recording delivery section and the old portfolio caption.
- Retained reusable semantic typography roles, JavaScript state selectors, hover/focus/disabled/error/success styles, fullscreen/dialog states, reduced-motion handling and HELP's `vh`/`svh` compatibility fallback.

Across the former shared and HELP styles, rule blocks decreased from **774 to 699**, and declarations from **2,207 to 2,074**. These counts include font faces and keyframes. There are no duplicate selector blocks in the same scope, no undefined/unused custom properties, and no repeated property declarations except the intentional HELP viewport-height fallback.

No photographs, recording artwork, original source JPEGs, fonts, icons or media were deleted. Source assets and external application dependencies remain available; removing a selector was not treated as evidence that an asset was obsolete.

## Verification

Used installed Microsoft Edge with temporary Playwright/Python tooling. No package or testing dependency was added to the site.

- Compared **93 before/after computed-style and geometry snapshots**, covering every page at desktop, tablet and phone widths, plus open navigation, expanded biography/FAQs, tool dialogs and form error/success states. Every snapshot matched.
- Captured **30 full-page screenshot pairs** at 1440, 768 and 390px, and inspected desktop/mobile page overview sheets and live embedded-tool/media screenshots. Twenty-five initial pairs were pixel-identical; three more matched in controlled same-DOM rerenders. The remaining differences were a one-channel antialiasing change at 20 pixels on the tablet 404 and painting inside a deliberately blocked third-party iframe. First-party geometry/styles matched in both cases; the actual live Groove editor was separately inspected and exercised.
- Checked all ten pages at 320, 600, 650, 651, 900, 901, 1200 and 1920px, in addition to the three comparison widths. Verified document/heading fit; the intentionally clipped accessibility heading is excluded from visible-text fit checks. Rechecked the live metronome at all eight additional widths.
- Passed 57 local interaction batches: desktop/mobile navigation and focus recovery, all FAQs, biography, required-field validation and intercepted pending/error/success form responses, tool help/fullscreen, nested 404 assets and no-JavaScript fallbacks. No enquiry reached Web3Forms.
- Passed 12 live integration batches: metronome tempo/subdivision/playback/fullscreen; Groove note editing, query forwarding, playback, sharing and fullscreen; both review rails; native Instagram preview/close; HELP entry warning, video and audio controls; YouTube playback; and Soundslice desktop/phone rendering.
- Verified slow experience counters, both review rails' actual ten-second automatic advances, reduced motion and HELP's early audio-error state. Mobile Groove editing/playback was exercised in its recommended landscape layout; portrait framing/panning remains available.
- All pre-existing HTML except HELP, all pre-existing JavaScript, provider configuration, URLs, credits and testimonials match the starting source bytes. CSS parsing, shared stylesheet ownership, SVG references and generated navigation/video consistency checks passed. No uncaught browser errors were observed.

Soundslice and the Drone YouTube embed were checked using local files inside an intercepted browser context at the site's HTTPS origin; this did not publish files or change production. Their existing localhost restrictions remain. Instagram's native Play link opens Instagram.

Backups, screenshots and detailed results are in `%TEMP%\davedrums-css-audit-20261106`. Safari, Firefox, physical devices and audible speaker output were not separately tested. No commit, push, deployment or BFT Reservoir change was made.
