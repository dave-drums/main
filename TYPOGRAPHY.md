# Shared typography

Updated on 6 November 2026, including the homepage, Watch, Lessons, Recording and tool heading pass. All nine Dave Drums pages load `assets/styles.css`. The independent HELP site owns `help/styles.css`.

## Fonts and roles

Dave Drums uses self-hosted Inter for headings and DM Sans for reading/interface text. Georgia is reserved for the italic rhythm signatures. The separate HELP band page retains its approved monospace identity in its own stylesheet, with no dependency on Dave Drums fonts or tokens.

| Role | Shared selector/token | Behaviour |
| --- | --- | --- |
| Homepage name | `.heading-name`, `--type-name` | White, fluid 44–120px size, larger than subpage titles |
| Hero/page title | H1 / `.heading-hero`, `--type-hero` | Shared fluid 40–80px size across Lessons, Recording and Watch; medium weight |
| Feature heading | `.heading-feature`, `--type-feature` | Uses the same size and line height as section headings |
| Section heading | H2 / `.heading-section`, `--type-h2` | Shared fluid 32–64px size and heading line height |
| Subsection | H3 / `.heading-subsection`, `--type-h3` | Shared fluid 20–32px size, tracking and spacing |
| Smaller heading | H4 / `.heading-small`, `--type-h4` | Shared scale with a 1rem minimum |
| Compact card heading | H5/H6 / `.heading-card`, `--type-card` | Compact information hierarchy |
| Lead | `.lead` and service lead roles, `--type-lead` | DM Sans, regular weight, 1.5 line height |
| Reading copy | Body / `.body-copy`, `--type-body` | 1rem, regular weight, 1.75 line height |
| Interface/action | `--type-ui`, `--type-action` | Shared navigation, buttons, forms and tool controls |
| Compact text | `--type-copy-small`, `--type-label-small` | Fixed compact copy and label sizes where required |

Weights are regular 400, medium 500, semibold 600 and bold 700. Page titles use medium; section and subsection headings use semibold. Compact lists and cards use the shared 16–18px card role. Tool page titles retain a compact 28–48px scale to leave room for workspace controls. The hero motto has its own 20–24px signature scale.

Home, Lessons and Recording section headings generally occupy one line on desktop. The homepage “Your music / My drums” heading retains its two-line composition. “Dave / D’Amore”, “Let’s make / some noise” and “Let’s hear / your ideas” use desktop-only line breaks. The Lessons approach, teacher and location titles wrap within their text columns. The approach heading aligns with “What You Can Learn”; the location heading aligns with the FAQs. The teacher photo sits to the right of its heading and copy. Contact forms begin level with their section headings on desktop and follow the introduction on smaller screens. Below 900px, long section titles wrap naturally at a readable size. Headings omit full stops; numbered terms retain their numbering punctuation.

## Editing

- Keep fonts, type scales, colours, weights, line heights and spacing tokens in the Design tokens section; semantic defaults and reusable type roles belong in Typography.
- Use semantic headings for document structure. Reuse the shared title, section and subsection scales; keep image crops and reading measures in page layout rules.
- Accent heading words with `.heading-accent`. Main site headings use normal Inter; the footer signature deliberately uses `.editorial-word`.
- Body text inherits the common font and line height. Use `.lead` for introductory copy, `.section-label` for editorial labels and the shared `.button`/`.text-link` components for actions.
- Keep shared service introductions/details, tool controls/dialogs, video players and icon rules under Shared components. Page-specific rules and responsive behaviour stay in their labelled sections.
- The embedded metronome, Groove Lab and third-party players own their internal typography. Do not copy their CSS into the page stylesheet.

The earlier CSS consolidation audit is recorded in `CSS-AUDIT.md`. Its before/after comparisons predate this requested heading redesign.
