# Project conventions

- Every Dave Drums page must load the single shared `assets/styles.css` stylesheet using a path appropriate to the page. Use root-relative asset paths on `404.html` so missing nested URLs work.
- Keep typography, design tokens, shared components, page layouts and responsive rules in the labelled sections of `assets/styles.css`. Reuse shared classes and custom properties; do not introduce inline styles or additional stylesheets.
- Put necessary page-specific rules in the corresponding section of `assets/styles.css`; keep shared JavaScript directly in `assets/`.
- Keep Recording Terms links off the homepage, recording page and main/footer navigation. Do not add them unless explicitly requested. Preserve the existing terms page at `/recording/terms.html`.
- The temporary HELP site in `help/` is independent. Keep its CSS, JavaScript and media inside that folder so it can move to its own domain without Dave Drums assets. Do not merge its styles or scripts into the main site.
