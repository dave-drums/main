# Shared CSS audit

Completed locally on 3 November 2026. This was a maintenance refactor with the current working tree as the visual and functional reference.

## Coverage and ownership

| Page | Shared stylesheet | Inline style attributes | Style blocks |
| --- | --- | --- | --- |
| `/` | `assets/styles.css` | 0 | 0 |
| `/lessons/` | `../assets/styles.css` | 0 | 0 |
| `/recording/` | `../assets/styles.css` | 0 | 0 |
| `/recording/terms.html` | `../assets/styles.css` | 0 | 0 |
| `/metronome/` | `../assets/styles.css` | 0 | 0 |
| `/404.html` | `/assets/styles.css` | 0 | 0 |

Each document already loaded exactly one stylesheet. No inline HTML styling or embedded CSS needed migration, and no additional site stylesheet or CSS import was found. HTML and JavaScript files are byte-for-byte unchanged by this audit.

The independently hosted React metronome owns its styles inside Shadow DOM. Its stylesheet, white card and controls stay with that application; copying those rules into this repository would break the established styling isolation. The live embedded application was included in the verification.

The shared JavaScript uses the Web Animations API for runtime reveals and measured biography height transitions. Those dynamic effects remain in JavaScript. No animation geometry, timings, interaction handlers or application code was moved or changed.

## Maintenance changes

- Consolidated the document's body defaults into one base rule.
- Centralised the repeated light-surface palette into shared theme variables. Preserved the existing colour-scheme behaviour of ordinary light sections and the terms page.
- Grouped identical full-bleed image sizing and positioning rules. Preserved every page's focal points, responsive crops, dimensions and aspect ratios.
- Shared the repeated editorial/profile photo containers and copy gutters.
- Moved the reusable service-page introductions and musician/profile layouts into the shared-components section, leaving lesson-specific rules in the Lessons section.
- Removed the overridden service-link margin and redundant header, hero, photo, copy, contact and collapse-control declarations at responsive breakpoints.
- Kept intentional desktop, mobile, hover, focus, disabled, error, success, reveal and reduced-motion variants.
- Expanded declarations onto separate lines for easier review and future maintenance.

The stylesheet retains labelled sections for tokens/fonts, typography, global layout/accessibility, shared components, navigation/footer, homepage, Lessons, Recording, contact forms, terms, metronome/404 and responsive/motion rules. Shared section labels remain controlled by `.section-label` and its typography token.

Across base and media-query rules, the stylesheet now contains 377 style/font rules and 926 declarations, compared with 387 rules and 964 declarations before this audit. This removes 10 rules and 38 declarations. There are no duplicate selector blocks within a single scope or repeated property declarations within a rule. Formatting adds whitespace for readability; this is not presented as a transfer-size optimisation.

## Verification

Checks used installed Microsoft Edge through temporary Playwright tooling and a local HTTP server. No dependency or test framework was added to the website.

- Compared 192 before/after snapshots across all six pages, checking 101 CSS properties on every DOM element, generated pseudo-elements where present, and element geometry.
- Covered widths 320, 375, 430, 600, 768, 900, 901, 1024, 1200, 1440 and 1920px. Cases included no-JavaScript presentation, enhanced navigation, compact headers, mobile menus, focus/hover states, expanded biography/FAQs and form status variants.
- Every computed-style and geometry snapshot matched the pre-refactor baseline.
- Captured 18 before/after full-page screenshot pairs at mobile, tablet and desktop widths. Seventeen pairs matched pixel-for-pixel. The tablet 404 pair differed only at two glyph-edge pixels; a controlled before/after rerender using the original and refactored stylesheets was pixel-identical.
- Compared the actual mounted Shadow DOM metronome with each stylesheet: the widget screenshots were pixel-identical.
- Passed 39 functional assertions covering all-page navigation readiness, images, scroll reveals, statistics, animated biography sizing/collapse/focus recovery, mobile keyboard focus containment/Escape/scroll locking, service FAQs, form validation/pending/error/success states, metronome tempo and Start/Stop, and reduced motion.
- Intercepted all form submissions with mock responses. No test enquiry was sent to Web3Forms.
- Found no uncaught browser errors. Parsed all CSS scopes and confirmed stylesheet paths, zero inline HTML styles/style blocks, and unchanged HTML/JavaScript source files.
- `git diff --check` passed.

Source backups, screenshots and detailed comparison results are in `%TEMP%\davedrums-css-audit`. Temporary verification scripts were removed from the website checkout.

These checks establish unchanged appearance and behaviour in the tested Edge environment, including emulated responsive viewports. Safari, Firefox and physical devices were not separately tested. Existing external-service behaviour and accessibility characteristics were preserved; this audit does not claim new Lighthouse or WCAG certification.

## Local changes only

This audit modified `assets/styles.css`, updated the CSS ownership guidance in `README.md`, and added this report. Existing uncommitted work was preserved. No branch, commit, push, pull request, deployment, DNS or live-site change was made.
