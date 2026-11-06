# Dave Drums — creative direction V3

Implemented locally on 5 November 2026. No commit, push or deployment was made. BFT Reservoir was not modified.

## What needed to change

The previous site used a repeated composition: full-bleed photo, uppercase title, supporting paragraph and underlined action. The service pages opened with similar half-and-half layouts, the recording artwork was secondary to service information, and reviews appeared as generic white Google cards. Typography and spacing refinements alone did not change that underlying rhythm.

V3 establishes a musician portfolio with an editorial type system and contrasting artist, teaching and recording chapters. The starting checkout, including all existing uncommitted work, is preserved in `%TEMP%\davedrums-v3\before`. The subsequent creative pass is preserved in `%TEMP%\davedrums-v3-review\before-creative-pass`.

## Major design decisions

- **A performance-led homepage.** A large festival photograph establishes real live experience, with the artist name set over the performance. A separate charcoal service index brings together the musician's roles, experience and Recording/Lessons pathways. A custom static rhythm graphic connects the composition to drumming. Phone layouts pair the performance image with a two-column service index; both services fit the tested 390px first screen.
- **Photography as a narrative.** An asymmetric studio portrait and biography introduce the musician. The teaching chapter uses a staggered studio photograph; the recording chapter introduces real release artwork rather than repeating another full-width studio backdrop.
- **Editorial typography.** The existing Inter and DM Sans fonts remain. Selected Georgia italic phrases bring contrast to feature headings and service titles without an additional font request. Charcoal, warm off-white and blue remain the core identity.
- **A light Lessons spread.** The title and introduction sit above a panoramic classroom photograph on larger screens. Phones use an editorial title/photo masthead followed by the lesson information and enquiry action, which now fits the tested 390px first screen. Icon-led curriculum rows include concise learning details; open student-level rows replace repetitive feature columns.
- **Reviews as an editorial reading feature.** Both original rails now use warm paper, blue rules and quotation marks, with reviewer details beneath each quote. All 22 card interiors, names and quotes are unchanged. Native scrolling, keyboard access, autoplay, pause conditions and carousel controls remain. A short instruction explains how to read longer reviews.
- **A studio-led Recording page.** The immersive studio introduction leads directly into the four real releases, presented as a featured release beside a compact three-entry session index. Technical services, process and delivery details follow. On phones the recording collection retains its native horizontal browsing.
- **Sharper genuine artwork.** Matching 640px covers were obtained from the existing releases' Spotify CDN. They were compared visually with the local 300px covers and supplied as responsive WebP variants. The original JPEG URLs, credits, awards and listening links remain.
- **Quiet interface details.** The mobile menu uses matching menu/close glyphs; dropdown and footer service links have meaningful icons. Enquiry forms use an open writing surface with underlined controls, associated labels and the original submission behaviour. The footer has a distinct identity area, clear navigation and a separate bottom row.
- **Less competing motion.** Hero text now appears immediately and experience figures remain static. Subtle one-time reveals, link feedback, biography disclosure and reduced-motion support remain.

All site styling remains in the labelled sections of `assets/styles.css`. Superseded split-layout rules were removed, and responsive rules remain together in the final section. There are no new runtime dependencies, extra stylesheets, icon fonts or inline style attributes.

## Icon system

`assets/icons.svg` is a custom, static 24-unit line system with 28 symbols and a consistent 1.6-unit stroke, rounded caps and joins. Twenty-six symbols are used. Instances inherit colour and use shared 16/20/24/28/34px roles appropriate to the interface.

| Context | Examples |
| --- | --- |
| Artist and services | Drum, waveform, headphones, recording layers |
| Lesson information | Students, age/person, location, book, metronome |
| Recording process | Message, sliders, microphone, download |
| Technical delivery | Layers, mixing sliders, drum kit |
| Enquiries | Message, email, phone, directional action |
| Navigation and footer | Menu/close, chevrons, service/tool symbols, external and upward arrows |

The sprite is one cacheable local asset. Instances are decorative, `aria-hidden="true"` and `focusable="false"`; visible text and existing accessible names supply meaning. The system works without JavaScript.

## Preservation checks

Compared with the V3 starting snapshot:

- All 22 testimonial card interiors, names and quotes are identical. `assets/testimonials.js` is byte-for-byte unchanged.
- Original form inputs, textareas, select options, hidden configuration and provider action are identical on all three enquiry forms.
- Recording credits, award text and every portfolio destination are identical. The artwork is the same artwork at a higher resolution.
- Recording Terms clauses and notation text/iframe URLs are unchanged. Decorative arrows now use the SVG system.
- The metronome module, Groove Lab logic, tool help/fullscreen handlers, sitemap, robots and CNAME are unchanged.
- All public URLs remain. Recording Terms stays at its existing URL and remains outside the homepage, recording page and shared navigation.

## Checks performed

The installed Edge browser was exercised headlessly using existing temporary Playwright tooling. No test packages were added to the project.

- **72 page/viewport checks:** all eight pages at 320, 375, 390, 600, 768, 900, 1024, 1440 and 1920px. No document horizontal overflow, broken loaded images or overflowing visible headings. No uncaught page errors.
- **Actual screenshots inspected:** desktop, tablet and phone views of all eight pages, full-page primary-page compositions, loaded portfolio artwork, both review layouts, the mobile menu, the corrected tablet footer and loaded Groove Lab. Additional footer checks covered 320–900px.
- **Navigation/content:** desktop hover and keyboard dropdowns, arrow/End/Escape operation, mobile disclosure controls, scroll lock, inert background, focus recovery, biography expansion/collapse, FAQ keyboard use and no-JavaScript navigation/story/FAQ fallbacks passed.
- **Forms:** all three passed required-field validation, intercepted provider failure with retained input, retry, intercepted success/reset and retained enquiry selection. No real enquiry was sent.
- **Reviews:** both eleven-card rails passed manual next/Home/End and disabled end-state checks. Autoplay advancement, hover pause, reduced-motion/manual availability and existing pause behaviour were exercised.
- **Tools:** help dialogs, Escape/focus recovery and fullscreen entry/exit passed for both tools. The live metronome mounted and responded to Start/Stop. Groove Lab loaded; query forwarding, touch portrait guidance/dismissal, panning and sharing were checked. Its implementation remains unchanged.
- **Motion:** immediate hero text, normal-motion biography disclosure, static experience values and live reduced-motion changes passed.
- **Accessibility:** axe-core checked WCAG A/AA rule groups through WCAG 2.2 at desktop and phone widths on all eight pages, with final phone checks on the three primary pages. Seven pages had no automated violations; the existing external metronome issue below remains.
- **Source checks:** `scripts/audit-seo.py` passed for eight pages and seven canonical sitemap URLs with zero errors. Shared-navigation generation/check, six JavaScript syntax checks, CSS parsing, SVG reference/accessibility validation and `git diff --check` passed. This buildless project has no package build step.

The latest 72-layout/16-accessibility-run validation, reports, helpers, source snapshots and inspected screenshots are retained in `%TEMP%\davedrums-v3-review`. Earlier V3 verification is in `%TEMP%\davedrums-v3`.

### Local performance smoke measurements

Single cold-cache phone runs used a 390 × 844 viewport, 4× CPU slowdown, 150ms network latency and approximately 1.6Mbps download throughput, with reduced motion enabled.

| Page | LCP | Initial CLS | Initial resource transfer |
| --- | ---: | ---: | ---: |
| Home | 2.21s | 0 | 422KB |
| Lessons | 2.28s | 0 | 280KB |
| Recording | 2.15s | 0 | 453KB |

These are development smoke measurements, not Lighthouse scores or production Core Web Vitals. Image selection, preload proximity and production caching affect transfer totals.

## Genuine artwork sources

The URLs below supplied matching higher-resolution versions of the existing artwork. No artwork or recording credit was invented.

| Existing release | Source |
| --- | --- |
| Darkshore — Hopeless | [Spotify artwork](https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b27326c24f7388bfc479fede4136) |
| Darkshore — The Cost | [Spotify artwork](https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b273941c9bc099819e235d73db66) |
| Abi Muir — Stockholm | [Spotify artwork](https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b27379e3581c6457877dcaab4c88) |
| Abi Muir — Still The Same | [Spotify artwork](https://image-cdn-ak.spotifycdn.com/image/ab67616d0000b2731e5631e3d0a68cd96635d1e8) |

## Remaining limits

- The independently hosted metronome has an existing Start-button text contrast ratio of 2.06:1. Both viewport scans reported the same issue. Its Shadow DOM application and sibling repository were not modified.
- Soundslice loads its existing URL but blocks `127.0.0.1` through its embed allowlist. The page and integration are preserved. Local playback requires the preview hostname to be allowed in the owner's Soundslice settings; production playback was not certified here.
- No real Web3Forms email delivery, physical audio assessment, physical-device testing, Safari/Firefox testing, production Lighthouse run, field INP or Google Search Console/Rich Results validation was performed. Automated checks do not certify complete WCAG compliance, particularly inside cross-origin applications.
