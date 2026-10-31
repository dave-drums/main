# Dave Drums

A buildless static website for Dave D’Amore, hosted on GitHub Pages at https://www.davedrums.com.au/.

## Preview and edit

Open index.html in a browser, or use VS Code’s Live Server extension. No framework, package installation or build command is required. Use an HTTP preview when testing Web3Forms; service restrictions can differ for file URLs.

## Structure

- index.html — homepage content, navigation, contact form and SEO metadata
- assets/typography.css — active font families, text styles and responsive typography
- assets/styles.css — layout, component colours, spacing and responsive behaviour
- assets/script.js — lesson counters, mobile navigation and enquiry handling
- img/ — original photographs, branding and responsive WebP images
- recording-terms/index.html — recording terms page
- CNAME — existing GitHub Pages custom domain
- LICENSE and .gitignore — project licensing and local file exclusions

The page loads Google Fonts, then typography.css and styles.css. Keep typography in typography.css and preserve responsive cascade order when editing it. Use document-relative asset paths so the site also works under a GitHub Pages project path.

## Content and behaviour

About, Lessons and Recording navigate to homepage sections. Contact links to #contact. Keep index.html and the existing section IDs stable.

The mobile menu closes when a link is selected, the user clicks outside it, Escape is pressed, or the desktop breakpoint is crossed. The lesson statistics animate once when visible and respect reduced-motion preferences.

The enquiry form uses Web3Forms with native validation, a spam honeypot and inline status feedback. Failed submissions preserve entered details. Service enquiry buttons preselect the appropriate form option. Native form submission remains available without JavaScript.

Four lazy-loaded Spotify players show selected recordings in one row on desktop and two columns on smaller screens. Google Fonts, Spotify and Web3Forms require an internet connection.

## Media

Responsive images use readable names such as dave-studio1-960.webp. Update both src and srcset when replacing them. Original photographs, unreferenced media and videos remain available for future editing; their removal requires a separate decision.

## Validation and publishing

Static cleanup checks confirmed unchanged body markup, matching retained CSS declarations and media contexts, valid structured-data JSON, and existing local asset and anchor targets.

Browser launch was unavailable in the cleanup environment. Desktop, tablet and mobile visual comparison, menu interaction and live form delivery still need browser verification. No automated build or test command exists in this checkout.

Publish the static root using the existing GitHub Pages setup. No deployment configuration was added, and no commit, push or deployment was performed.
