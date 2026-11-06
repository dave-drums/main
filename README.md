# Dave Drums

The buildless Dave Drums website: semantic HTML, one shared stylesheet and small JavaScript enhancements. GitHub Pages serves the repository root. No framework, package installation or build step is required.

## Local preview

From this repository in PowerShell:

```powershell
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' scripts/serve.py 4173
```

Open **http://127.0.0.1:4173/**. Stop the server with `Ctrl+C`. Alternatively, use VS Code Live Server for ordinary file paths; use the supplied server when checking extensionless URLs. Use HTTP rather than opening HTML files directly so module imports and root-relative paths behave correctly. The metronome, GrooveScribe and enquiry provider need an internet connection.

Preview `/lessons/`, `/recording/`, `/recording/terms.html`, `/metronome/`, `/groove/`, `/watch/`, `/notation/karnivool-drone`, `/help/` and `/404.html`. The local preview supports extensionless HTML aliases, matching the public host. The preview server returns the shared `404.html` with HTTP 404 for missing URLs, including nested paths, matching GitHub Pages. That document uses root-relative assets and navigation.

## Source map

| File | Purpose |
| --- | --- |
| `index.html` | Cinematic introduction, biography, lessons, recording and enquiry form |
| `lessons/index.html` | Teaching approach, student levels, teacher, location, FAQs and enquiry form |
| `recording/index.html` | Services, selected work, process, deliverables, musician, FAQs and enquiry form |
| `recording/terms.html` | Original eight recording clauses with an on-page contents index |
| `watch/index.html` | Featured drum cover and selected Instagram performances |
| `metronome/index.html` | Page surrounding the independently hosted metronome |
| `groove/index.html` | Full-width frame for the independently hosted GrooveScribe editor |
| `notation/karnivool-drone.html` | Soundslice transcription page, canonical URL `/notation/karnivool-drone` |
| `404.html` | Root-relative error document |
| `help/index.html` | Separate HELP band landing page, preserving its own visual identity |
| `assets/styles.css` | Labelled tokens, typography, components, layouts, forms and responsive rules |
| `help/styles.css`, `help/script.js` | Independent HELP styles, entry warning, video backdrop, audio controls and waveform |
| `assets/script.js` | Motion, counters, biography and enquiry enhancement |
| `assets/navigation.js` | Shared desktop dropdowns, mobile accordions, focus and active-section handling |
| `assets/tools.js` | Shared HOW TO USE dialogs and container fullscreen for the Metronome |
| `assets/testimonials.js` | Lesson-review carousel with manual controls and reduced-motion support |
| `assets/video.js` | Click-to-load video players with external-link and no-JavaScript fallbacks |
| `config/videos.json` | Featured YouTube performance and selected Instagram post links |
| `scripts/sync-videos.py` | Generates Watch, homepage and notation video markup from the selected links |
| `config/navigation.json` | Single source for direct links and Services/Tools groups |
| `scripts/sync-navigation.py` | Generates consistent static headers and footers on every page |
| `scripts/audit-seo.py` | Checks page metadata, source structure, JSON-LD relationships, local resources, anchors and sitemap consistency |
| `scripts/serve.py` | Local HTTP preview with extensionless `.html` routes matching the public host |
| `assets/metronome.js` | Existing remote module mount and loading/error feedback |
| `assets/groove.js` | Groove query links and optional full-screen controls |
| `assets/fonts/` | Self-hosted Inter and DM Sans Latin WOFF2 files and OFL licences |
| `img/` | Authentic responsive photographs, recording artwork, logo and favicon |
| `REDESIGN.md` | Repository audit, design decisions, validation results and trade-offs |
| `PREMIUM-REFINEMENT.md` | Earlier refinement and its verification results |
| `CREATIVE-DIRECTION-V3.md` | Current art direction, icon system, artwork sources and V3 verification |
| `assets/icons.svg` | Shared 24-unit SVG line icon system |
| `CSS-AUDIT.md` | Current shared-style ownership, cleanup and before/after verification |

## Design and editing

The current design uses a studio-portrait homepage with a compact service index, a live-performance About photograph, photo-led Lessons and Recording introductions, white Google-style reviews and a Watch portfolio. Normal Inter headings use blue accents; the footer keeps its Georgia italic signature. One static SVG sprite supplies navigation, service, practical-information and enquiry icons. The separately branded HELP page preserves its own palette and monospace type.


Use the single `assets/styles.css` file for all nine Dave Drums pages. Its first section defines colours, type scales, spacing, gutters, columns, header dimensions and motion. Responsive rules live in its final section, with main breakpoints at 600px, 900px and 1200px.

Keep Dave Drums styling in that stylesheet; do not add inline CSS or extra stylesheets to Dave Drums pages. Shared image layouts, service introductions/details, hosted-tool frames and profile compositions belong in Shared components. HELP is an independent temporary site: its CSS, script and media stay inside `help/`, so that folder can move to its own domain. The metronome keeps its Shadow DOM styles and GrooveScribe keeps its iframe styles.

Inter is used for display and interface headings, DM Sans for reading and interface text, and the system Georgia face for selected editorial italic phrases. Inter and DM Sans are self-hosted variable fonts with `font-display: swap`; there are no external font stylesheets or added font downloads. Keep font licences with the files. Use dark blue interaction colours on light sections and cyan on dark sections.

The shared type system uses fluid `--type-*` scales, weight/tracking/line-height tokens and reusable `heading-*`, `lead`, `body-copy` and `section-label` roles. The homepage artist name is uppercase; service titles and feature headings use authored sentence case with `.heading-accent` colour. Medium (500) and semibold (600) have separate tokens. See `TYPOGRAPHY.md` for editing guidance and intentional composition-specific sizes.

Homepage sections use a studio portrait opening, a festival performance photograph, a lesson-room composition and selected recording artwork. The Recording introduction uses a full-width studio photograph. Adjust individual `object-position` rules when changing images; do not add a global crop. Preserve dimensions, `srcset`, `sizes`, first-image priority and lazy loading. Original teaching JPEG remains available; active pages use the smaller 600/1000px WebP derivatives.

The expanded biography is a labelled editorial section below the whole About split. Its primary button and one bottom collapse button expose `aria-expanded`; closing restores focus and scroll position to the primary control. Hidden or closing content is excluded from keyboard navigation. Without JavaScript, the full biography remains readable and the inactive controls stay hidden. Keep `#about`, `#full-story`, `#lessons`, `#recording`, `#contact` and dedicated service URLs stable.

Navigation uses progressive enhancement: native disclosures and static links work before handlers attach and without JavaScript. The open mobile menu locks page scrolling, makes main/footer inert, contains keyboard focus and closes on Escape, link selection or a breakpoint change. Experience figures count slowly once on arrival; reduced motion keeps their final values static and disables nonessential transitions and reveals. Content remains available without JavaScript.

## Shared navigation and footer

All nine shared-navigation pages, including Watch, Recording Terms, the Karnivool notation page and 404, use `Home | About | Watch | Services | Free Tools | Contact`. Services contains Drum Lessons and Drum Recording; Free Tools contains Metronome, Groove Lab and Drum Notation — Drone. These group labels are disclosure controls, not landing-page links. Footers show direct links under Explore, Services and Free Tools. Recording Terms remains accessible at its existing URL and is not added to either navigation.

Edit `config/navigation.json` for link labels, destinations or group contents, then run:

```powershell
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' scripts/sync-navigation.py
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' scripts/sync-navigation.py --check
```

The first command updates generated headers/footers in every local HTML page; `--check` reports stale output without writing. The renderer in `scripts/sync-navigation.py` owns the shared markup. Do not hand-edit generated header/footer blocks. New pages can reuse the existing page shell and are discovered automatically when they contain the shared header/footer. The generator adds `assets/navigation.js` using each page's asset prefix. No build step is required to serve the already-generated static website.

Navigation and branding use root-relative links/assets so nested pages and missing nested URLs on the 404 work correctly. Exact pages receive `aria-current="page"`; Services stays marked as the current section on Recording Terms without adding a terms link. Home's About and Contact anchors update `aria-current="location"` in both the header and footer.

Desktop disclosures support mouse hover/click, touch, Enter/Space, Tab, arrow keys, Home/End, Escape and outside clicks. Mobile Services/Free Tools act as mutually exclusive accordions. Escape closes the active group before closing the mobile menu. Focus returns to the controlling summary/button without jumping the page; short menus scroll vertically within the panel. Resize and page restoration clear stale open states. Native dialog focus/Escape handling remains available to the Groove Lab orientation prompt.

Navigation verification used installed Edge with temporary Playwright tooling: 77 page/viewport combinations across all seven pages at 320, 375, 430, 600, 768, 900, 901, 1024, 1200, 1440 and 1920px, plus 320×568 and 844×390 menu checks on every page. Tests cover pointer/touch/keyboard interactions, focus containment/recovery, active indicators, scrolling, native no-JavaScript disclosures, nested-URL 404 links and both embedded tools. Main-page content, existing head metadata, app loaders and sitemap match their pre-navigation sources. Biography, service FAQs and an intercepted enquiry submission also passed; no real enquiry was sent. `scripts/sync-navigation.py --check` and `git diff --check` passed. Reports and screenshots are in `%TEMP%\davedrums-navigation`. Other browsers and physical devices were not separately tested.

## Existing services and integrations

The Drum Lessons page retains two independently controlled groups of eleven supplied testimonials. Shared white Google-style cards contain the locally served G logo, reviewer name, five gold stars and original quote. Cards are 17rem high at all widths; longer text scrolls vertically. Rails show three cards on desktop, two on tablet and one on mobile. Each visible rail advances every ten seconds and reverses at the ends. Hover, focus, touch, background tabs and offscreen sections pause movement; reduced motion disables autoplay. Arrows, keyboard controls and native touch scrolling remain available. All 22 supplied reviews are preserved exactly. See `TESTIMONIALS-NOTATION.md` for the original selection notes.

There is no notation index or listing link. The supplied preview server returns the shared 404 page with HTTP 404 for `/notation` and `/notation/`. VS Code Live Server may still generate a directory listing for this physical folder; use `scripts/serve.py` to preview the intended response. The transcription page preserves `/notation/karnivool-drone` as its canonical extensionless URL, using `notation/karnivool-drone.html` as the static source. The existing public GitHub Pages host serves `.html` aliases this way; `scripts/serve.py` mirrors that behaviour locally. Its Soundslice URL is exactly `https://www.soundslice.com/slices/jXQqc/embed/`. The production-origin HTTP check returns player HTML, while localhost currently fails Soundslice's embed allowlist; add the preview hostname in Soundslice if local playback is needed. No Soundslice settings or accounts were changed.

Three enquiry forms retain the original Web3Forms provider, public account configuration, names, hidden inputs, honeypot, optional phone field and native validation. JavaScript adds duplicate-submit prevention, a timeout, pending/success/error feedback and preservation of entered text after failure. Do not send test submissions to the real provider unless deliberately testing delivery. The recording form retains its existing omission of the Live session work option. Service pages retain their selected default enquiry type; recognised `?enquiry=` values are also supported.

The four recordings retain their artwork, credits, award text and Spotify/YouTube links. They use external listening links, not inline audio players. On phones the gallery can be scrolled by touch or keyboard; focusing links brings their recording into view.

The metronome is loaded from `https://dave-drums.github.io/metronome/embed/metronome.js` and mounts its own React application inside Shadow DOM. The white card, application controls and separate repository are unchanged. Do not copy its implementation here, add an iframe or override its internal styles.

GrooveScribe uses `https://groove.davedrums.com.au/`, the same full editor framed by [Practice Vault's groove page](https://github.com/dave-drums/vault/blob/main/groove.html). The independent [GrooveScribe repository's CNAME](https://github.com/dave-drums/GrooveScribe/blob/main/CNAME) confirms that deployment. Its live response permits framing. `/groove/` embeds that URL directly without copying code or changing either external repository; the separate `GrooveEmbed.html` is a player and does not include the full editor.

Both tools use the same `.tool-intro`, `.tool-copy`, `.tool-actions` and `.tool-button` components: heading/description on the left and HOW TO USE/FULL SCREEN on the right, stacking at the shared mobile breakpoint. Descriptions use the available header width, staying on one line where space allows and wrapping naturally on smaller screens. HOW TO USE opens a centred native dialog with a dark backdrop and a scrollable instruction area. Close, Escape or a backdrop click dismisses it and restores focus to the header button. `assets/tools.js` enhances the existing HTML instructions without duplicating them; native details remain available when JavaScript or modal dialogs are unsupported. The dialog stays inside the fullscreen workspace and does not remount either tool.

Headers and guides stay inside each fullscreen workspace, keeping the exit control available. The Metronome's container uses the browser Fullscreen API without remounting its Shadow DOM app; Groove Lab retains its existing fullscreen/query/orientation handler in `assets/groove.js`. Unsupported browsers keep fullscreen controls hidden. Native iframe scrolling stays available for additional measures and smaller viewports. The editor has an 800px minimum width: portrait phones can pan horizontally, with landscape recommended for editing. Full screen preserves the running editor and unsaved changes. Use the editor's Share action to retain subsequent edits in a URL.

The fullscreen control sits alongside HOW TO USE in the shared header. Touch devices up to 900px wide receive Practice Vault's optional portrait orientation prompt, using the site's shared colours, typography, spacing and a rotating phone outline. Rotation to landscape hides it automatically; tapping the prompt or pressing Escape dismisses it for the current page visit. The native dialog stays inside the workspace so it also works in full screen, restores focus on close and leaves the running editor intact. Mouse-only desktop viewports do not show it. Without dialog support or JavaScript, the prompt remains hidden. Phone animation respects reduced motion.

Orientation-refinement checks in Edge cover touch portrait/landscape transitions, tap/Escape dismissal, focus, reduced motion, scrolling, mobile navigation, full-screen rotation, and centred toolbar controls at seven widths from 320px to 1920px. Playback continues across the prompt; editing, sharing and SVG downloads still work after dismissal. Results and screenshots are in `%TEMP%\davedrums-groove-orientation`.

`assets/groove.js` forwards `/groove/?TimeSig=...&Div=...` query data to the fixed app origin, matching Practice Vault's link format. The frame delegates audio, clipboard, sharing and full-screen permissions and retains the application's native popup, download and printing behaviour. Full-screen controls appear only when the browser supports them. No code attempts to read or restyle the cross-origin editor.

Local GrooveScribe verification uses installed Edge with temporary Playwright tooling. All seven pages passed layout/navigation checks at ten widths from 320px to 1920px, with no document overflow; existing page content and shared JavaScript are unchanged apart from the added navigation links. Actual editing, Web Audio playback/pause, full-URL sharing/copy, SVG/PNG/MIDI downloads and a notation-only print popup/PDF passed. Phone emulation covers portrait panning/sharing, landscape editing/playback/full screen, all three downloads, and the native print action with notation-only print styles. Screenshots, source backups and results are in `%TEMP%\davedrums-groove`. Mobile browser download/print UI and physical devices need their own platform checks; no claim of physical printing or Safari testing is made. The app's external short-link/social services remain independently maintained; full-URL sharing was verified.

Recording terms clauses are unchanged and remain available at `/recording/terms.html`. Terms links stay off the homepage, recording page and main/footer navigation.

## Video portfolio

Preview `/watch/` for the video portfolio. `config/videos.json` contains the featured YouTube cover and selected Instagram Reels. After editing it, run `python scripts/sync-videos.py`; `--check` reports stale generated markup. This updates the Watch page, homepage preview and Drone notation page together. Each selected video needs its HTTPS URL and a descriptive title; descriptions and local poster images are optional. Local posters must live in `img/` and include their pixel dimensions. No sample videos are added when the configuration is empty.

The featured cover is `https://www.youtube.com/watch?v=2XUMTnUKAKc`. Its authentic YouTube thumbnail was saved unchanged from `https://i.ytimg.com/vi/2XUMTnUKAKc/maxresdefault.jpg` to `img/karnivool-drone-performance.jpg` (1280 × 720). Nine user-selected Instagram Reels are configured in the supplied order. Their authentic public thumbnails are saved unchanged as `img/reel-{id}.jpg`; titles and descriptions use their captions and visible video titles. Both account-scoped Instagram URLs (`/{account}/reel/{id}/`) and canonical Reel/post URLs are supported.

Players load only after a visitor selects a preview. The YouTube player uses `youtube-nocookie.com`; Instagram posts use their individual native embeds. The supplied Reels' native embeds currently open Instagram when their Play link is selected; inline video playback is controlled by Instagram. Embed height follows bounded `MEASURE` messages validated against the exact Instagram origin and iframe window. Closing a video removes its iframe/listener and restores the poster and keyboard focus. Starting another player stops the previous one. Poster links work without JavaScript. Watch omits duplicate links below its players; the homepage and notation previews retain their separate YouTube links. The existing Soundslice embed remains independent.

The Drone notation page uses the site's light paper background, normal headings with a blue accent and original release artwork. Its interactive score precedes the cover video; the original Soundslice URL is preserved. The page is linked from Free Tools in the shared header and footer, with the correct current-page indicator on its extensionless URL.

Reels/notation verification used Edge at eight widths from 320px to 1920px, with desktop, tablet and phone screenshots inspected. All nine real Instagram embeds loaded, resized and closed; player switching, focus recovery, and desktop/mobile navigation passed. Four accessibility scans reported no WCAG A/AA violations. Soundslice rendered at desktop and phone widths when these local files were served inside an intercepted browser context at the site's HTTPS origin; localhost remains blocked by its existing allowlist. The desktop dropdown's focus-out handler now uses the actual next focus target, preventing premature closure when selecting submenu links. No files were deployed by these checks.

Local previews on `localhost`, `127.0.0.1` and IPv6 loopback open YouTube directly from the poster. The Drone cover's player reports unavailable on the HTTP loopback origin. The same local files were tested in an intercepted browser context with the site's HTTPS origin: YouTube returned playable and the video advanced. No deployment was involved in that test. Normal website visitors retain the inline click-to-load player.

## SEO and hosting

Each indexable page has a unique title and description, aligned Open Graph/Twitter metadata, an absolute HTTPS canonical and JSON-LD. Service and tool pages include breadcrumb data; the lesson service describes the real Campbellfield teaching location and its northern Melbourne catchment. Metronome and Groove Lab retain static HTML instructions enhanced into HOW TO USE dialogs. About and Contact remain homepage sections, not separate indexable pages.

All seven canonical public URLs, including Recording Terms and the Karnivool notation page, are in `sitemap.xml`. The 404 retains `noindex, follow` and root-relative assets. `robots.txt`, `CNAME` and GitHub Pages configuration remain unchanged. See `SEO-AUDIT.md` for the complete audit, final metadata, verification limits and recommendations for the separately hosted Groove Lab application's indexing.

Run the dependency-free source checks after editing:

```powershell
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' scripts/audit-seo.py
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' scripts/sync-navigation.py --check
```

Use `scripts/audit-seo.py --json` for the metadata inventory. These source checks do not replace browser interaction/layout testing, Google's Rich Results Test or Search Console URL Inspection.

All redesign changes are local and uncommitted. No push, pull request or deployment has been performed. See `REDESIGN.md` for measured validation and remaining verification limits.
