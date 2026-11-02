# Dave Drums

A buildless static website for Dave D’Amore, hosted on GitHub Pages at https://www.davedrums.com.au/.

## Preview and edit

Open index.html in a browser, or use VS Code’s Live Server extension. No framework, package installation or build command is required. Use an HTTP preview when testing Web3Forms; service restrictions can differ for file URLs.

## Structure

- index.html — homepage content, navigation, contact form and SEO metadata
- lessons/index.html — dedicated private drum lessons page for Campbellfield and Melbourne's northern suburbs
- recording/index.html — professional acoustic drum recording benefits, process and selected work
- assets/styles.css — the single stylesheet: tokens, typography, shared components, page layouts and responsive rules
- assets/script.js — motion effects, lesson counters, mobile navigation and enquiry handling
- img/ — active photographs, branding, responsive WebP images and recording artwork
- recording/terms.html — recording terms page
- 404.html — custom GitHub Pages error page (excluded from the sitemap)
- CNAME — existing GitHub Pages custom domain
- LICENSE and .gitignore — project licensing and local file exclusions

Every page loads Inter for headings and DM Sans for body/UI text through Google Fonts, alongside the single `assets/styles.css` stylesheet. The recording page retains Oswald only for its existing process-step numerals. Its labelled sections cover design tokens, typography, global layout, shared components, navigation/footer, each page and responsive rules. Edit typography tokens centrally: `--h2-scale` adjusts all H2 sizes while preserving their hierarchy, and `--font-size-card-heading` controls shared card headings. H1 headings remain uppercase; section and card headings use authored Title Case. Use document-relative asset paths on ordinary pages; the 404 page needs root-relative paths.

## Content and behaviour

About navigates to the homepage biography. Lessons opens `/lessons/` and Recording opens `/recording/`. The homepage service sections remain available at `#lessons` and `#recording`. Contact links to the local form at `#contact` on the homepage, lessons page and recording page; the terms page links to the homepage form. Keep index.html and the existing section IDs stable.

The service pages use native details/summary FAQs and existing photography. Both service pages have their own copy of the Web3Forms contact section. Their enquiry links target the local `#contact`, with Drum lessons or Drum recording selected by default as appropriate. The shared script also supports recognised enquiry values in query strings. The homepage keeps its root canonical URL regardless of the query string.

The homepage and service pages use `index.html` files; recording terms live at `/recording/terms.html`. Keep service-page links and metadata on `/lessons/` and `/recording/`. GitHub Pages handles the directory redirects from their versions without a trailing slash when the files are published; no client-side redirect is needed. `sitemap.xml` includes all four public pages, and `robots.txt` references it.

Recording Terms remains available at `/recording/terms.html`, but stays out of the homepage, recording page and main/footer navigation. Do not add visible links to it without an explicit request.

The mobile menu closes when a link is selected, the user clicks outside it, Escape is pressed, or the desktop breakpoint is crossed. The lesson statistics animate once when visible and respect reduced-motion preferences.

The homepage, lessons and recording enquiry forms use the same Web3Forms account and shared styles and script. Keep their field styles, validation and hidden settings in sync. The recording page intentionally excludes Live session work from its enquiry options; the homepage and lessons page retain it. Each page has one form. The enquiry form uses Web3Forms with native validation, a spam honeypot and inline status feedback. Failed submissions preserve entered details. Service enquiry buttons preselect the appropriate form option. Native form submission remains available without JavaScript.

Four recording cards show selected projects in one row on wide desktops, two columns on tablets and a swipeable horizontal gallery on phones. Each card has equal-width Spotify and YouTube listening links, with no embedded players. The gallery can also be focused and scrolled with a keyboard. Google Fonts, external listening links and Web3Forms require an internet connection.

The four project cards appear only on the recording page. Keep their existing artwork, titles, credits, awards and listening links intact when editing. The showcase is static HTML and remains available without JavaScript.

## Visual behaviour

Full-width section backgrounds keep their content aligned with the shared maximum width and page gutters. Primary enquiry buttons use a restrained accent tint. Project cards retain the original credits and linked artwork, with side-by-side Spotify and YouTube listening buttons for each track.

Service pages share `page-hero`, `page-section`, `section-intro`, `profile-layout`, `feature-grid--equal`, feature cards and native FAQ controls, alongside the common contact form. Keep page-specific exceptions small and place all breakpoint overrides in the Responsive styles section of `assets/styles.css`.

Intersection Observer reveals headings, photos, badges, list items and recording cards once. Paragraphs and form fields remain immediately readable. The small hero image parallax runs only on desktop devices with a fine pointer. Both effects respect reduced motion, including preference changes while the page is open; content and navigation remain available without JavaScript. Artwork hover effects also have visible keyboard focus states.

## Media

Responsive images use readable names such as dave-studio1-960.webp. Update both src and srcset when replacing them. Previously unused images were moved to the sibling `_unused_backup` directory outside this website root.

Recording artwork is the actual 300 × 300 JPEG thumbnail supplied by Spotify's oEmbed metadata for each existing track:

- `img/darkshore-hopeless.jpg` — [Darkshore — Hopeless](https://open.spotify.com/track/6Z6wapfql469gsOop4C6Mf)
- `img/darkshore-the-cost.jpg` — [Darkshore — The Cost](https://open.spotify.com/track/75ojpYwSHdwY1qvqZISJyS)
- `img/abi-muir-stockholm.jpg` — [Abi Muir — Stockholm](https://open.spotify.com/track/5sk5SrDmzbxtXgzDHo3o0Q)
- `img/abi-muir-still-the-same.jpg` — [Abi Muir — Still The Same](https://open.spotify.com/track/0s81MmE0zKLJhTNZXCegcY)

## Validation and publishing

Check all five pages, including the 404 page at a nested missing URL, at desktop, tablet and mobile widths, with keyboard navigation, reduced motion and JavaScript disabled. Check the enquiry form with mocked success and failure responses before testing live delivery deliberately. No automated build or test command exists in this checkout.

Publish the static root using the existing GitHub Pages setup. No deployment configuration was added, and no commit, push or deployment was performed.
