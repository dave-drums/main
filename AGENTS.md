# Project conventions

- Every new page must load the shared `assets/typography.css` and `assets/styles.css`, in that order, using paths relative to the page (for example, `../assets/typography.css` for a page one directory deep).
- Reuse the shared typography, variables and component styles for new pages and files. Keep typography rules in `assets/typography.css` and shared layout/component rules in `assets/styles.css`; do not duplicate them in page-specific files or inline styles.
- Add page-specific styling only where needed, following the existing `assets/recording-terms.css` convention. Keep shared CSS and JavaScript directly in `assets/`.
