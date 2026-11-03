# Dave Drums V2 — local redesign

## Repository audit (before implementation)

The working tree was clean on branch `main`. This is a buildless HTML/CSS/JavaScript site on GitHub Pages. Six documents exist: `/`, `/lessons/`, `/recording/`, `/recording/terms.html`, `/metronome/`, and `/404.html`. No package manager, build task, automated test suite, local fonts or CI configuration exists.

All pages use `assets/styles.css`; shared behaviour lives in `assets/script.js`. Existing design uses small headings, rounded photographs, bordered feature cards, tinted statistics and several decorative gradients. These constrain the requested editorial direction and will be replaced with a coherent shared system rather than additional overrides.

### Content and functionality to preserve

- Full three-paragraph biography, teaching background, service details, locations and ages 10+.
- Three native/JavaScript-enhanced Web3Forms forms, including field names, account configuration, honeypot, native validation, service selection, pending/success/error states and entered text on errors.
- Four selected recordings with original artwork, credits, awards and Spotify/YouTube destinations. These are listening links, not embedded audio players.
- Native expandable service FAQs and keyboard-accessible navigation.
- Remote React metronome mounted by `assets/metronome.js` from `https://dave-drums.github.io/metronome/embed/metronome.js`. Its application and CSS live in Shadow DOM. The sibling repository and internal controls must remain untouched.
- Eight recording terms clauses, preserved verbatim. The brief explicitly requests a terms link on the recording page; place one in the recording information only, outside main/footer navigation and the homepage.
- Existing canonical URLs, titles, descriptions, Open Graph/Twitter data, Person/WebSite/Service/WebPage structured data, sitemap and robots. Preserve CNAME and deployment configuration.

### Assets and opportunities

Three authentic photographic sets have responsive WebP variants: studio panorama (960/1920), studio performance (800/1200), outdoor festival (800/1200). The teaching photograph is a 266 KB JPEG; responsive WebP derivatives can reduce its transfer size. Four 300px recording artworks, transparent white logo and favicon are present. No stock or artificial photography is needed.

Hero imagery currently has intrinsic dimensions from original files rather than delivered variants. Existing festival image is enlarged with CSS, and rounded/card treatments dominate. Use individually chosen focal points, correct image dimensions and responsive source selection. Retain high priority only on the first large photograph and lazy loading elsewhere.

Accessibility foundations include skip links, labelled fields, focus outlines, form live regions and reduced-motion handling. Improvements needed: reliable mobile scroll locking/focus containment, visible collapse control for biography, biography expansion below the complete split composition, stronger hierarchy, larger readable body text, and a useful no-JavaScript navigation fallback. Verify colour contrast on light surfaces; cyan is reserved for dark-surface interaction and darker blue is used on light backgrounds.

External dependencies: Google Fonts (Inter/DM Sans; recording also requests Oswald), Web3Forms, Spotify/YouTube links, Instagram and the metronome module. Remove the unnecessary third font. There are no audio files, invented equipment specifications or other client integrations to migrate. The live homepage differs from the checkout; the local repository is the implementation/content source of truth.

## Design system

Direction: cinematic photography, large tightly spaced Inter headings, DM Sans reading text, architectural split compositions, thin rules and square edges. Near-black `#101214`, charcoal `#1B1E21`, warm off-white `#F4F2ED`, white, and restrained cyan `#06B3FD`.

The single labelled stylesheet owns colour, type, spacing, container, grid, border, header and motion tokens. Heading sizes use `clamp()`. Shared page intros, open editorial lists, native FAQ disclosures, underlined action links, forms, navigation and footer are reused across pages. Media queries use documented 600/900/1200px breakpoints (CSS custom properties cannot be used in native media query conditions).

Homepage progression: full-viewport studio portrait → full-bleed festival/about split on warm white → reverse education split → full-width studio recording image → dark contact section. The full biography expands below the entire about split without resizing its image.

Service pages retain their detailed factual content while gaining photographic introductions, numbered section labels, open lists and integrated contact sections. Terms prioritise reading width, an on-page contents index and unchanged clauses. Metronome surroundings stay minimal and dark, with the separate white application intact. The 404 uses root-relative assets and clear recovery links.

Motion is brief and non-blocking: heading entrance, one-time section reveals, original lesson counters, link arrows, header state and biography disclosure. Reduced motion disables nonessential animation. Content remains visible without JavaScript.

## Completed implementation

All six pages now share the new typography, navigation, footer, actions and responsive system. The homepage has been restructured around photography and editorial splits. Its complete original biography is retained and expands beneath the split with animated height, explicit expanded state and two collapse controls. The photograph does not resize. The native disclosure remains functional without JavaScript.

Lessons has a new photographic opening, numbered learning topics, open student-level columns, full-bleed teacher composition, location/FAQ layout and dark enquiry section. Recording has a studio opening, four original recording examples, an open four-step process, a visible comparison of original delivery options, musician profile, FAQs and enquiry form. No equipment or unsupported credentials were added. Terms has a reading-width layout and contents index; all eight clauses are unchanged. The metronome retains its original separately hosted white card, module and Shadow DOM. The 404 has the same shared identity and root-relative recovery links.

Navigation now locks background scrolling, contains keyboard focus, marks background regions inert, restores focus and clears state on navigation/breakpoint changes. Service enquiry selection, original form configuration, all listening destinations, credits, award text and full biography were checked against `HEAD`. The original counter effect remains; parallax was removed to keep deliberate crops stable. Reveals, disclosure and header/link motion respect reduced-motion preferences.

## Validation results — 3 November 2026

Browser checks used installed Microsoft Edge headlessly through temporary Playwright tooling, with a local HTTP server. Tooling and screenshots were kept in the system temporary directory, outside the delivered website.

- All six pages served and were reviewed in desktop and mobile screenshots; tablet screenshots were also captured. Additional screenshots covered the expanded biography and open mobile navigation.
- 48 layout checks passed across 375, 430, 600, 768, 900, 1024, 1440 and 1920px, plus a separate 320px reflow check on every page. No document-level horizontal overflow was found. The recording gallery intentionally scrolls inside its own region on phones.
- The broad browser pass completed 85 assertions (48 viewport checks plus 37 image/interaction checks) with zero uncaught page errors. Follow-up checks covered final biography animation, both collapse controls, fixed photo geometry, final crops, semantic statistics groups, no-JavaScript controls and reduced motion.
- Mobile menu opening, scroll locking, inert background, keyboard focus wrap, Escape, link dismissal and desktop breakpoint recovery passed.
- All three forms passed native empty-field validation, pending/disabled state, mocked server failure with retained input, retry, mocked success/reset and restored submit controls. Query-string service preselection passed. No real enquiry was sent.
- Native service FAQs worked by keyboard. Navigation, biography and FAQs also worked with JavaScript disabled. The metronome's no-JavaScript notice was visible.
- The actual remote metronome mounted in Shadow DOM. Tempo +/− controls and Start/Stop responded. Blocking its module produced the existing retry feedback. Its source, controls and separate repository were not modified.
- The real `404.html` was served at a simulated nested missing URL; its root-relative logo, stylesheet and recovery paths worked.
- Axe-core 4.10.3 ran WCAG 2 A/AA, 2.1 A/AA and 2.2 AA checks at 1440px and 375px. No automated violations were found on home, lessons, recording, terms or 404. Final statistics groups use a valid group role. Image-background contrast still requires human judgement; automated checks do not certify full WCAG compliance.
- A known contrast violation remains inside the independent metronome: its Start button uses `#06B3FD` on `#DAF4FF` (2.06:1, below 4.5:1). The brief explicitly forbids changing the separate application or its controls, so its styles were preserved. This is the outstanding accessibility issue.
- Static checks passed for unique IDs, one H1 per page, one stylesheet per page, no inline styles, local link/anchor destinations, image paths, canonical URLs and parseable JSON-LD. All eight terms clauses, all original form fields/settings, recording credits/destinations and the full biography were compared with the original files and preserved.
- Existing sitemap URLs, robots, CNAME and hosting configuration are unchanged. The 404's original `noindex, follow` is retained; public pages remain crawlable. Metronome social metadata and WebPage structured data were added.

### Measured performance and limits

The original teaching JPEG is 265,838 bytes. The new 1000px WebP is 94,832 bytes (64% smaller); the 600px variant is 43,742 bytes (84% smaller). Original JPEG URLs remain valid. The two self-hosted Latin variable fonts total 85,188 bytes and remove external font CSS requests, including the former third font.

An unthrottled localhost desktop smoke run observed homepage LCP at 184ms and initial CLS at 0. Other pages in that run reported LCP between 48–68ms and initial CLS 0. These are development measurements, with shared browser caches and no mobile network/CPU throttling; they are not production Core Web Vitals guarantees. Lighthouse scores, field INP, real mobile hardware, Safari/Firefox and live Web3Forms delivery were not measured. External listening destinations were preserved exactly; playback on Spotify/YouTube depends on those services. Headless testing verified metronome UI responses, not subjective audio quality.

## Changed files

Modified:

- `index.html`
- `lessons/index.html`
- `recording/index.html`
- `recording/terms.html`
- `metronome/index.html`
- `404.html`
- `assets/styles.css`
- `assets/script.js`
- `README.md`

Added:

- `REDESIGN.md`
- `assets/fonts/inter-latin.woff2`
- `assets/fonts/dm-sans-latin.woff2`
- `assets/fonts/Inter-OFL.txt`
- `assets/fonts/DM-Sans-OFL.txt`
- `img/drum-lessons-1000.webp`
- `img/drum-lessons-600.webp`

`assets/metronome.js`, all original photographs/artwork, the separate metronome repository, `sitemap.xml`, `robots.txt`, `CNAME`, licensing and deployment configuration were preserved.

## Exact local preview

From `C:\Users\ddamo\Documents\Website\Dave Drums\main` in PowerShell:

```powershell
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`. Stop with `Ctrl+C`. Python's simple server serves `/404.html` directly; GitHub Pages supplies that document for missing nested paths. External form submission and the metronome require internet access.

All changes remain in the current local working tree, uncommitted and unpushed. No branch, commit, pull request, publication, deployment, DNS or live-site change was made.
