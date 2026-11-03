# Dave Drums

The buildless Dave Drums website: semantic HTML, one shared stylesheet and small JavaScript enhancements. GitHub Pages serves the repository root. No framework, package installation or build step is required.

## Local preview

From this repository in PowerShell:

```powershell
& 'C:\Users\ddamo\AppData\Local\Programs\Python\Python311\python.exe' -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173/**. Stop the server with `Ctrl+C`. Alternatively, use VS Code Live Server. Use HTTP rather than opening HTML files directly so module imports and root-relative paths behave correctly. The metronome and enquiry provider need an internet connection.

Preview `/lessons/`, `/recording/`, `/recording/terms.html`, `/metronome/` and `/404.html`. Python's standard server shows its own error document for missing URLs; GitHub Pages uses the repository's `404.html`. That document uses root-relative assets and navigation for missing nested URLs.

## Source map

| File | Purpose |
| --- | --- |
| `index.html` | Cinematic introduction, biography, lessons, recording and enquiry form |
| `lessons/index.html` | Teaching approach, student levels, teacher, location, FAQs and enquiry form |
| `recording/index.html` | Services, selected work, process, deliverables, musician, FAQs and enquiry form |
| `recording/terms.html` | Original eight recording clauses with an on-page contents index |
| `metronome/index.html` | Page surrounding the independently hosted metronome |
| `404.html` | Root-relative error document |
| `assets/styles.css` | Labelled tokens, typography, components, layouts, forms and responsive rules |
| `assets/script.js` | Motion, counters, biography, navigation and enquiry enhancement |
| `assets/metronome.js` | Existing remote module mount and loading/error feedback |
| `assets/fonts/` | Self-hosted Inter and DM Sans Latin WOFF2 files and OFL licences |
| `img/` | Authentic responsive photographs, recording artwork, logo and favicon |
| `REDESIGN.md` | Repository audit, design decisions, validation results and trade-offs |

## Design and editing

Use the single `assets/styles.css` file. Its first section defines colours, type scales, spacing, gutters, columns, header dimensions and motion. Responsive rules live in its final section, at 600px, 900px and 1200px. Native CSS media queries cannot use custom properties as their breakpoint conditions.

Keep site-owned styling in that stylesheet; do not add inline style attributes, `<style>` blocks or extra stylesheets. Shared image layouts, service introductions and profile compositions belong in the shared-components section. Runtime animation geometry remains in JavaScript, and the separate metronome keeps its Shadow DOM styles. See `CSS-AUDIT.md` for the audit and before/after verification results.

Inter is used for headings and DM Sans for reading and interface text. Both are self-hosted variable fonts with `font-display: swap`; there are no external font stylesheets. Keep font licences with the files. Use dark blue interaction colours on light sections and cyan on dark sections.

The shared type system uses fluid `--type-*` scales, weight/tracking/line-height tokens and reusable `heading-*`, `lead`, `body-copy` and `section-label` roles. H1 and homepage feature headings render uppercase; internal H2/H3 titles retain authored Title Case. Keep component font sizes tied to those tokens. See `TYPOGRAPHY.md` for the hierarchy, responsive sizing and validation results.

Homepage sections use full-bleed photography. Adjust individual `object-position` rules when changing images; do not add a global crop. Preserve dimensions, `srcset`, `sizes`, first-image priority and lazy loading. Original teaching JPEG remains available; active pages use the smaller 600/1000px WebP derivatives.

The expanded biography is a labelled editorial section below the whole About split. Its primary button and one bottom collapse button expose `aria-expanded`; closing restores focus and scroll position to the primary control. Hidden or closing content is excluded from keyboard navigation. Without JavaScript, the full biography remains readable and the inactive controls stay hidden. Keep `#about`, `#full-story`, `#lessons`, `#recording`, `#contact` and dedicated service URLs stable.

Mobile navigation uses progressive enhancement: links are visible until handlers attach. The open menu locks page scrolling, makes main/footer inert, contains keyboard focus and closes on Escape, link selection or a breakpoint change. Reduced motion disables nonessential motion and preserves final counter values. Content remains available without JavaScript.

## Existing services and integrations

Three enquiry forms retain the original Web3Forms provider, public account configuration, names, hidden inputs, honeypot, optional phone field and native validation. JavaScript adds duplicate-submit prevention, a timeout, pending/success/error feedback and preservation of entered text after failure. Do not send test submissions to the real provider unless deliberately testing delivery. The recording form retains its existing omission of the Live session work option. Service pages retain their selected default enquiry type; recognised `?enquiry=` values are also supported.

The four recordings retain their artwork, credits, award text and Spotify/YouTube links. They use external listening links, not inline audio players. On phones the gallery can be scrolled by touch or keyboard; focusing links brings their recording into view.

The metronome is loaded from `https://dave-drums.github.io/metronome/embed/metronome.js` and mounts its own React application inside Shadow DOM. The white card, application controls and separate repository are unchanged. Do not copy its implementation here, add an iframe or override its internal styles.

Recording terms clauses are unchanged and remain available at `/recording/terms.html`. Terms links stay off the homepage, recording page and main/footer navigation.

## SEO and hosting

Existing titles, descriptions, canonical URLs and structured data are preserved. The metronome now also has social-image/Twitter metadata and WebPage structured data. All five public URLs remain in `sitemap.xml`; the intentional `noindex, follow` directive is retained on the 404 only. `robots.txt`, `CNAME` and GitHub Pages configuration are unchanged.

All redesign changes are local and uncommitted. No push, pull request or deployment has been performed. See `REDESIGN.md` for measured validation and remaining verification limits.
