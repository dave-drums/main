# Dave Drums typography

All website typography lives in `assets/styles.css`: shared scales and weights in Design tokens, semantic defaults and reusable roles in Typography, and layout rules in the existing component/page sections. Inter is used for headings and DM Sans for reading and interface text. Both fonts are self-hosted variable fonts; the Inter face exposes the lighter weights used by the heading system.

## Hierarchy

Representative desktop values are measured at a 1440px viewport. Heading scales remain fluid and container-aware where appropriate.

| Role | Semantic default / reusable class | Shared token | Desktop reference | Treatment |
| --- | --- | --- | --- | --- |
| Page hero | H1 / `.heading-hero` | `--type-hero` | 70px maximum | Uppercase, Inter 600 |
| Homepage name | H1 + `.heading-name` | `--type-name` | 105px | Inter 600 |
| Homepage feature | H2 + `.heading-feature` | `--type-feature` | about 68px, capped at 84px | Uppercase, Inter 600 |
| Internal section | H2 / `.heading-section` | `--type-h2` | about 38px, capped at 42px | Authored Title Case, Inter 600 |
| Subsection | H3 / `.heading-subsection` | `--type-h3` | 21px, capped at about 25px | Authored Title Case, Inter 600 |
| Smaller heading | H4 / `.heading-small` | `--type-h4` | about 17px, capped at about 19px | Authored sentence case, Inter 600 |
| Compact card / learning item | `.heading-card`, shared card headings, H5/H6 | `--type-card` | about 17px, capped at 18px | Inter 600 |
| Editorial label | `.section-label` | `--type-section-label` | 16px | Uppercase, DM Sans 600 |
| Lead | `.lead`, existing service/hero lead classes | `--type-lead` | about 19px, capped at 20px | DM Sans 400, 1.5 line height |
| Reading copy | Body / `.body-copy` | `--type-body` | 16px | DM Sans 400, 1.7 line height |
| Action | `.button`, `.text-link`, navigation controls | `--type-action` | about 14px, capped at 15px | Uppercase, DM Sans 600 |

`--heading-scale: .875` reduces the established display and heading scales by 12.5%. The H4 scale has a 16px minimum for readability. Learning items, service features, process cards, recording titles and delivery labels use the compact 16–18px card role, closer to emphasized reading text. Statistics, captions, navigation and icons retain their dedicated utility roles.

## Responsive behaviour

At 375px, representative values are a 28px internal-page hero, 38.5px homepage feature heading, 24.5px H2, 17.5px H3, 16px H4/card heading, 13px label/action text, about 16px lead and 16px reading copy. The homepage name remains larger at about 57px.

Display/heading scales use `clamp()` and shared scaling; body text stays at `1rem` across viewports and respects the browser's text-size preference. Hero text wrappers use `.type-frame` with inline-size containment to fit long words within split-screen columns. Shared line-height and gap variables control the rhythm between labels, headings and reading text. Existing grids, section structure, photographs and focal points remain intact.

On screens up to 600px wide, the metronome introduction retains its compact 8px top padding and 8px heading-to-copy gap, with no bottom margin. The player container has no fixed minimum height on mobile. The independently hosted metronome owns its controls and typography inside Shadow DOM; its application stylesheet is unchanged. Very short viewports can still require scrolling to keep those controls readable and usable.

## Editing and reuse

- Change `--heading-scale`, the role-specific `--type-*` tokens and shared weight/line-height/gap variables to update typography across all six pages and future pages.
- Use semantic H1–H6 elements for document structure. Use the matching `heading-*` role when presentation needs to differ from the semantic level.
- Use `.heading-feature` for homepage feature headings and `.heading-name` for the homepage name treatment.
- Use `.heading-card` for new compact headings. Existing `.feature-card`, `.benefit-grid` and `.track-content` headings receive this role centrally; do not duplicate their sizes in page-specific rules.
- Use `.lead` and `.body-copy` for reading roles. Shared measures control paragraph widths. Body copy inherits the global 16px default without a class.
- Keep Title Case and sentence case authored, preserving proper names, project titles and acronyms. Hero, homepage feature, editorial label and action uppercase treatments are CSS rules.
- Keep trailing full stops off headings while preserving meaningful internal punctuation, including `YOUR MUSIC. MY DRUMS`, terms numbering and body punctuation.
- Keep all typography in the labelled sections of the shared stylesheet. Do not add inline CSS or additional stylesheets.

## Verification

The refinement was checked locally in installed Microsoft Edge with temporary Playwright tooling. Results and screenshots are in `%TEMP%\davedrums-type-refinement`; no dependency or test framework was added to the checkout.

- All six pages were checked at 320, 375, 430, 600, 768, 900, 901, 1024, 1200, 1440 and 1920px for heading fit, document overflow, weights, body/card sizes and shared stylesheet ownership.
- Before/after heading comparisons at 375px and 1440px verify the shared 12.5% reduction, with the deliberately more compact card role checked separately.
- Desktop/mobile screenshots cover the homepage, supporting pages, learning list, recording features and live metronome.
- Navigation, biography disclosure and collapse, FAQs, metronome tempo and Start/Stop were checked. HTML and JavaScript hashes match the start of this refinement.
- The mobile metronome was measured at five phone sizes, retaining visibility of the full player at 375×812, 390×844 and 414×736. Shorter screens retain scrolling.
- No uncaught browser errors were observed. `git diff --check` passed. Other browsers and physical devices were not separately tested.

All changes remain local and uncommitted. No push, deployment or live-site change was made. Existing uncommitted work was preserved.
