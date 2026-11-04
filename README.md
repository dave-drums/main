# Dave Drums

The buildless Dave Drums website: semantic HTML, one shared stylesheet and small JavaScript enhancements. GitHub Pages serves the repository root. No framework, package installation or build step is required.

## Local preview

From this repository in PowerShell:

```powershell
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173/**. Stop the server with `Ctrl+C`. Alternatively, use VS Code Live Server. Use HTTP rather than opening HTML files directly so module imports and root-relative paths behave correctly. The metronome, GrooveScribe and enquiry provider need an internet connection.

Preview `/lessons/`, `/recording/`, `/recording/terms.html`, `/metronome/`, `/groove/` and `/404.html`. Python's standard server shows its own error document for missing URLs; GitHub Pages uses the repository's `404.html`. That document uses root-relative assets and navigation for missing nested URLs.

## Source map

| File | Purpose |
| --- | --- |
| `index.html` | Cinematic introduction, biography, lessons, recording and enquiry form |
| `lessons/index.html` | Teaching approach, student levels, teacher, location, FAQs and enquiry form |
| `recording/index.html` | Services, selected work, process, deliverables, musician, FAQs and enquiry form |
| `recording/terms.html` | Original eight recording clauses with an on-page contents index |
| `metronome/index.html` | Page surrounding the independently hosted metronome |
| `groove/index.html` | Full-width frame for the independently hosted GrooveScribe editor |
| `404.html` | Root-relative error document |
| `assets/styles.css` | Labelled tokens, typography, components, layouts, forms and responsive rules |
| `assets/script.js` | Motion, counters, biography and enquiry enhancement |
| `assets/navigation.js` | Shared desktop dropdowns, mobile accordions, focus and active-section handling |
| `config/navigation.json` | Single source for direct links and Services/Tools groups |
| `scripts/sync-navigation.py` | Generates consistent static headers and footers on every page |
| `scripts/audit-seo.py` | Checks page metadata, source structure, JSON-LD relationships, local resources, anchors and sitemap consistency |
| `assets/metronome.js` | Existing remote module mount and loading/error feedback |
| `assets/groove.js` | Groove query links and optional full-screen controls |
| `assets/fonts/` | Self-hosted Inter and DM Sans Latin WOFF2 files and OFL licences |
| `img/` | Authentic responsive photographs, recording artwork, logo and favicon |
| `REDESIGN.md` | Repository audit, design decisions, validation results and trade-offs |

## Design and editing

Use the single `assets/styles.css` file. Its first section defines colours, type scales, spacing, gutters, columns, header dimensions and motion. Responsive rules live in its final section, at 600px, 900px and 1200px. Native CSS media queries cannot use custom properties as their breakpoint conditions.

Keep site-owned styling in that stylesheet; do not add inline style attributes, `<style>` blocks or extra stylesheets. Shared image layouts, service introductions, hosted-tool frames and profile compositions belong in the shared-components section. Runtime animation geometry remains in JavaScript. The separate metronome keeps its Shadow DOM styles and GrooveScribe keeps its iframe styles. See `CSS-AUDIT.md` for the earlier audit and before/after verification results.

Inter is used for headings and DM Sans for reading and interface text. Both are self-hosted variable fonts with `font-display: swap`; there are no external font stylesheets. Keep font licences with the files. Use dark blue interaction colours on light sections and cyan on dark sections.

The shared type system uses fluid `--type-*` scales, weight/tracking/line-height tokens and reusable `heading-*`, `lead`, `body-copy` and `section-label` roles. H1 and homepage feature headings render uppercase; internal H2/H3 titles retain authored Title Case. Keep component font sizes tied to those tokens. See `TYPOGRAPHY.md` for the hierarchy, responsive sizing and validation results.

Homepage sections use full-bleed photography. Adjust individual `object-position` rules when changing images; do not add a global crop. Preserve dimensions, `srcset`, `sizes`, first-image priority and lazy loading. Original teaching JPEG remains available; active pages use the smaller 600/1000px WebP derivatives.

The expanded biography is a labelled editorial section below the whole About split. Its primary button and one bottom collapse button expose `aria-expanded`; closing restores focus and scroll position to the primary control. Hidden or closing content is excluded from keyboard navigation. Without JavaScript, the full biography remains readable and the inactive controls stay hidden. Keep `#about`, `#full-story`, `#lessons`, `#recording`, `#contact` and dedicated service URLs stable.

Navigation uses progressive enhancement: native disclosures and static links work before handlers attach and without JavaScript. The open mobile menu locks page scrolling, makes main/footer inert, contains keyboard focus and closes on Escape, link selection or a breakpoint change. Reduced motion disables nonessential motion and preserves final counter values. Content remains available without JavaScript.

## Shared navigation and footer

All seven pages, including Recording Terms and 404, use `Home | About | Services | Tools | Contact`. Services contains Drum Lessons and Drum Recording; Tools contains Metronome and Groove Lab. These group labels are disclosure controls, not landing-page links. Footers show direct links under Explore, Services and Tools. Recording Terms remains accessible at its existing URL and is not added to either navigation.

Edit `config/navigation.json` for link labels, destinations or group contents, then run:

```powershell
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' scripts/sync-navigation.py
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' scripts/sync-navigation.py --check
```

The first command updates generated headers/footers in every local HTML page; `--check` reports stale output without writing. The renderer in `scripts/sync-navigation.py` owns the shared markup. Do not hand-edit generated header/footer blocks. New pages can reuse the existing page shell and are discovered automatically when they contain the shared header/footer. The generator adds `assets/navigation.js` using each page's asset prefix. No build step is required to serve the already-generated static website.

Navigation and branding use root-relative links/assets so nested pages and missing nested URLs on the 404 work correctly. Exact pages receive `aria-current="page"`; Services stays marked as the current section on Recording Terms without adding a terms link. Home's About and Contact anchors update `aria-current="location"` in both the header and footer.

Desktop disclosures support mouse hover/click, touch, Enter/Space, Tab, arrow keys, Home/End, Escape and outside clicks. Mobile Services/Tools act as mutually exclusive accordions. Escape closes the active group before closing the mobile menu. Focus returns to the controlling summary/button without jumping the page; short menus scroll vertically within the panel. Resize and page restoration clear stale open states. Native dialog focus/Escape handling remains available to the Groove Lab orientation prompt.

Navigation verification used installed Edge with temporary Playwright tooling: 77 page/viewport combinations across all seven pages at 320, 375, 430, 600, 768, 900, 901, 1024, 1200, 1440 and 1920px, plus 320×568 and 844×390 menu checks on every page. Tests cover pointer/touch/keyboard interactions, focus containment/recovery, active indicators, scrolling, native no-JavaScript disclosures, nested-URL 404 links and both embedded tools. Main-page content, existing head metadata, app loaders and sitemap match their pre-navigation sources. Biography, service FAQs and an intercepted enquiry submission also passed; no real enquiry was sent. `scripts/sync-navigation.py --check` and `git diff --check` passed. Reports and screenshots are in `%TEMP%\davedrums-navigation`. Other browsers and physical devices were not separately tested.

## Existing services and integrations

Three enquiry forms retain the original Web3Forms provider, public account configuration, names, hidden inputs, honeypot, optional phone field and native validation. JavaScript adds duplicate-submit prevention, a timeout, pending/success/error feedback and preservation of entered text after failure. Do not send test submissions to the real provider unless deliberately testing delivery. The recording form retains its existing omission of the Live session work option. Service pages retain their selected default enquiry type; recognised `?enquiry=` values are also supported.

The four recordings retain their artwork, credits, award text and Spotify/YouTube links. They use external listening links, not inline audio players. On phones the gallery can be scrolled by touch or keyboard; focusing links brings their recording into view.

The metronome is loaded from `https://dave-drums.github.io/metronome/embed/metronome.js` and mounts its own React application inside Shadow DOM. The white card, application controls and separate repository are unchanged. Do not copy its implementation here, add an iframe or override its internal styles.

GrooveScribe uses `https://groove.davedrums.com.au/`, the same full editor framed by [Practice Vault's groove page](https://github.com/dave-drums/vault/blob/main/groove.html). The independent [GrooveScribe repository's CNAME](https://github.com/dave-drums/GrooveScribe/blob/main/CNAME) confirms that deployment. Its live response permits framing. `/groove/` embeds that URL directly without copying code or changing either external repository; the separate `GrooveEmbed.html` is a player and does not include the full editor.

The shared `.tool-intro` and `.app-*` components provide a compact introduction, full-width frame and optional full-screen workspace. Native iframe scrolling stays available for additional measures and smaller viewports. The editor has an 800px minimum width: portrait phones can pan horizontally, with landscape recommended for editing. Full screen preserves the running editor and unsaved changes. Use the editor's Share action to retain subsequent edits in a URL.

The Full screen button is centred beneath the introduction. Touch devices up to 900px wide receive Practice Vault's optional portrait orientation prompt, using the site's shared colours, typography, spacing and a rotating phone outline. Rotation to landscape hides it automatically; tapping the prompt or pressing Escape dismisses it for the current page visit. The native dialog stays inside the workspace so it also works in full screen, restores focus on close and leaves the running editor intact. Mouse-only desktop viewports do not show it. Without dialog support or JavaScript, the prompt remains hidden. Phone animation respects reduced motion.

Orientation-refinement checks in Edge cover touch portrait/landscape transitions, tap/Escape dismissal, focus, reduced motion, scrolling, mobile navigation, full-screen rotation, and centred toolbar controls at seven widths from 320px to 1920px. Playback continues across the prompt; editing, sharing and SVG downloads still work after dismissal. Results and screenshots are in `%TEMP%\davedrums-groove-orientation`.

`assets/groove.js` forwards `/groove/?TimeSig=...&Div=...` query data to the fixed app origin, matching Practice Vault's link format. The frame delegates audio, clipboard, sharing and full-screen permissions and retains the application's native popup, download and printing behaviour. Full-screen controls appear only when the browser supports them. No code attempts to read or restyle the cross-origin editor.

Local GrooveScribe verification uses installed Edge with temporary Playwright tooling. All seven pages passed layout/navigation checks at ten widths from 320px to 1920px, with no document overflow; existing page content and shared JavaScript are unchanged apart from the added navigation links. Actual editing, Web Audio playback/pause, full-URL sharing/copy, SVG/PNG/MIDI downloads and a notation-only print popup/PDF passed. Phone emulation covers portrait panning/sharing, landscape editing/playback/full screen, all three downloads, and the native print action with notation-only print styles. Screenshots, source backups and results are in `%TEMP%\davedrums-groove`. Mobile browser download/print UI and physical devices need their own platform checks; no claim of physical printing or Safari testing is made. The app's external short-link/social services remain independently maintained; full-URL sharing was verified.

Recording terms clauses are unchanged and remain available at `/recording/terms.html`. Terms links stay off the homepage, recording page and main/footer navigation.

## SEO and hosting

Each indexable page has a unique title and description, aligned Open Graph/Twitter metadata, an absolute HTTPS canonical and JSON-LD. Service and tool pages include breadcrumb data; the lesson service describes the real Campbellfield teaching location and its northern Melbourne catchment. Metronome and Groove Lab include static HTML instructions below their interfaces. About and Contact remain homepage sections, not separate indexable pages.

All six canonical public URLs, including the retained Recording Terms page, are in `sitemap.xml`. The 404 retains `noindex, follow` and root-relative assets. `robots.txt`, `CNAME` and GitHub Pages configuration remain unchanged. See `SEO-AUDIT.md` for the complete audit, final metadata, verification limits and recommendations for the separately hosted Groove Lab application's indexing.

Run the dependency-free source checks after editing:

```powershell
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' scripts/audit-seo.py
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' scripts/sync-navigation.py --check
```

Use `scripts/audit-seo.py --json` for the metadata inventory. These source checks do not replace browser interaction/layout testing, Google's Rich Results Test or Search Console URL Inspection.

All redesign changes are local and uncommitted. No push, pull request or deployment has been performed. See `REDESIGN.md` for measured validation and remaining verification limits.
