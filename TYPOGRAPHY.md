# Shared typography

Updated during the CSS audit on 6 November 2026. All nine Dave Drums pages load `assets/styles.css`. The independent HELP site owns `help/styles.css`.

## Fonts and roles

Dave Drums uses self-hosted Inter for headings and DM Sans for reading/interface text. Georgia remains only in the deliberate footer signature. The separate HELP band page retains its approved monospace identity in its own stylesheet, with no dependency on Dave Drums fonts or tokens.

| Role | Shared selector/token | Behaviour |
| --- | --- | --- |
| Hero | H1 / `.heading-hero`, `--type-hero` | Fluid, container-aware default; photo-led heroes retain their intentional composition-specific scales |
| Feature heading | `.heading-feature`, `--type-feature` | Large editorial section headings, with a phone scale |
| Section heading | H2 / `.heading-section`, `--type-h2` | Shared fluid scale and heading line height |
| Subsection | H3 / `.heading-subsection`, `--type-h3` | Shared scale, tracking and spacing |
| Smaller heading | H4 / `.heading-small`, `--type-h4` | Shared scale with a 1rem minimum |
| Compact card heading | H5/H6 / `.heading-card`, `--type-card` | Compact information hierarchy |
| Lead | `.lead` and service lead roles, `--type-lead` | DM Sans, regular weight, 1.5 line height |
| Reading copy | Body / `.body-copy`, `--type-body` | 1rem, regular weight, 1.75 line height |
| Interface/action | `--type-ui`, `--type-action` | Shared navigation, buttons, forms and tool controls |
| Compact text | `--type-copy-small`, `--type-label-small` | Fixed compact copy and label sizes where required |

Weights are regular 400, medium 500, semibold 600 and bold 700. Heading/display roles use the shared semibold token unless a composition deliberately uses medium. Existing computed weights were retained during consolidation.

## Editing

- Keep fonts, type scales, colours, weights, line heights and spacing tokens in the Design tokens section; semantic defaults and reusable type roles belong in Typography.
- Use semantic headings for document structure. Retain page-specific display sizes, image crops and reading measures where the composition requires them.
- Accent heading words with `.heading-accent`. Main site headings use normal Inter; the footer signature deliberately uses `.editorial-word`.
- Body text inherits the common font and line height. Use `.lead` for introductory copy, `.section-label` for editorial labels and the shared `.button`/`.text-link` components for actions.
- Keep shared service introductions/details, tool controls/dialogs, video players and icon rules under Shared components. Page-specific rules and responsive behaviour stay in their labelled sections.
- The embedded metronome, Groove Lab and third-party players own their internal typography. Do not copy their CSS into the page stylesheet.

The audit compared 93 before/after computed-style/geometry states across all pages without changing their typography or layout. See `CSS-AUDIT.md` for full coverage and verification limits.
