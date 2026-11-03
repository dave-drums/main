# Dave Drums typography

Typography is defined in `assets/styles.css`: fluid scales and weights in Design tokens, semantic defaults/reusable roles in Typography, and layout rules in the existing component/page sections. Inter remains the heading font; DM Sans remains the reading and interface font. No additional font files, stylesheets or dependencies were introduced.

## Hierarchy

Representative desktop sizes below were measured at a 1440px viewport; the scales continue fluidly toward their desktop caps at larger widths.

| Role | Semantic default / reusable class | Shared token | Desktop reference | Treatment |
| --- | --- | --- | --- | --- |
| Page hero | H1 / `.heading-hero` | `--type-hero` | 80px maximum | Uppercase, Inter 800 |
| Homepage name | H1 + `.heading-name` | `--type-name` | 120px | Larger name treatment retained on small screens |
| Homepage feature | H2 + `.heading-feature` | `--type-feature` | about 78px, rising to 96px | Uppercase, Inter 700 |
| Internal section | H2 / `.heading-section` | `--type-h2` | about 44px, capped at 48px | Authored Title Case, Inter 700 |
| Subsection | H3 / `.heading-subsection` | `--type-h3` | 24px, capped at 28px | Authored Title Case, Inter 700 |
| Smaller heading | H4 / `.heading-small` | `--type-h4` | about 20px, capped at 22px | Authored sentence case, Inter 700 |
| Editorial label | `.section-label` | `--type-section-label` | 16px | Uppercase, DM Sans 600 |
| Lead | `.lead`, existing service/hero lead classes | `--type-lead` | about 21px, capped at 22px | DM Sans 400, 1.5 line height |
| Reading copy | Body / `.body-copy` | `--type-body` | about 18px, capped at 19px | DM Sans 400, 1.7 line height |
| Action | `.button`, `.text-link`, navigation controls | `--type-action` | about 14px, capped at 15px | Uppercase, DM Sans 600 |

H4 styling is available without changing the semantic levels of existing content. Captions, project credits, field labels and navigation have named secondary UI scales. Statistics and the graphic 404 numeral retain dedicated utility tokens; they are not narrative headings. Mobile menu links retain a larger navigation role.

## Responsive behaviour

All core sizes use `clamp()`. At 375px, representative values are a 32px internal-page hero, 44px homepage feature heading, 28px H2, 20px H3, 18px H4, 13px label/action text, about 17px lead and 16px body text. The homepage name remains larger, at about 66px.

Hero text wrappers use `.type-frame` with inline-size containment. The shared H1 scale uses container units to fit long words within split-screen columns, avoiding bespoke Recording/Lessons font-size overrides. Existing grids, section structure, photographs and focal points remain intact; section heights grow naturally with the new type.

The supporting-page scale was reduced after feedback that the headings were too large. These changes apply through the shared semantic defaults across Lessons, Recording, Recording Terms, Metronome and 404, including shared subsections on the homepage. The homepage name and feature display treatments retain their existing sizes; reading copy remains on the same body scale everywhere.

On screens up to 600px wide, the metronome introduction uses 8px top padding and an 8px heading-to-copy gap. Its bottom margin is zero, leaving only the embedded player's own padding above the card. The previous 650px minimum container height is removed. The independent player's controls retain their existing size; very short screens can still require scrolling.

## Editing and reuse

- Change the `--type-*` tokens to adjust the scale once across pages. Component font sizes reference these tokens instead of independent pixel/rem/clamp values.
- Use the semantic H1–H4 defaults, or apply a matching `heading-*` role when presentation needs to differ from the tag. Keep semantic levels appropriate to the document.
- Apply `.heading-feature` to the existing homepage feature headings. Use `.heading-name` with an H1 or the hero role for the name treatment.
- Keep Title Case and sentence case authored, preserving proper names, project titles and acronyms such as FAQs. H1, feature, label and action uppercase treatments are CSS rules.
- Use `.lead` and `.body-copy` for reading roles. Shared measure and spacing variables control copy widths, label gaps, heading gaps and paragraph rhythm. Existing long-form and grid containers remain in place.
- Use the shared weight, tracking and line-height variables. Avoid restoring page-specific heading sizes in responsive rules.
- Keep trailing full stops off headings. Preserve meaningful internal punctuation, including `YOUR MUSIC. MY DRUMS`, and preserve terms numbering and body punctuation.

## Validation

The original typography audit completed 761 assertions, including 66 page/viewport combinations across all six pages at 320, 375, 430, 600, 768, 900, 901, 1024, 1200, 1440 and 1920px. Its checks below describe that original audit, before the smaller supporting-page scale and mobile spacing refinement.

- Verified heading/CTA fit, no document-level overflow, visible hero content, shared homepage feature sizes, heading font families, label weights and requested wide-desktop type ranges.
- Captured desktop, tablet and mobile screenshots and visually reviewed the resulting hierarchy and wrapping.
- Compared all heading words and semantic levels with the pre-change source. Only presentation classes, intended heading casing and trailing full stops were eligible to change. All body text, punctuation, link destinations, image attributes and form settings were preserved.
- JavaScript files are unchanged. Keyboard menu behaviour, FAQ controls, biography focus and fixed-photo behaviour, normal/reduced-motion expansion, mocked form validation/pending/error/success states, and live metronome tempo/Start/Stop controls passed.
- No test enquiries were sent; form requests were intercepted.
- Axe checks at 375px and 1440px reported no automated WCAG A/AA violations on the homepage, Lessons, Recording, Terms or 404. The independent metronome retains its existing Start-button contrast finding. Its internal control typography was compared before and after and remains unchanged.
- No uncaught browser errors were observed. All six pages retain the single shared stylesheet and no inline HTML styles or style blocks.

Testing used installed Microsoft Edge with temporary Playwright tooling. Screenshots and detailed results are in `%TEMP%\davedrums-typography`. Other browsers and physical devices were not separately tested; automated accessibility checks do not certify complete WCAG conformance.

The supporting-page refinement was checked again across all 66 page/viewport combinations for heading fit, document overflow and shared stylesheet ownership. Mobile metronome checks also cover eight width/height combinations, the live tempo controls, Start/Stop and mobile navigation. No uncaught browser errors were observed. Updated screenshots and results are in `%TEMP%\davedrums-mobile-refinement`.

All changes remain local and uncommitted. No branch, push, deployment or live-site changes were made. Existing user-added enhanced lesson photographs and other uncommitted work were preserved.
