# Drum lesson testimonials and Karnivool – Drone notation

Prepared locally on 5 November 2026 (Australia/Sydney), in the main Dave Drums repository only. No commit, push or deployment was run. The separate GrooveScribe and Metronome repositories were not modified.

## Selected testimonials

Source: the review screenshots supplied in this conversation. The ZIP was not present in the attachment directory, but the visible screenshots supplied enough material; no additional source files were needed. All ten selected screenshots show five stars. Excerpts below match the displayed source without corrections to the reviewers' wording. The Holly Muir source review is displayed as Holly Daisy at the user's explicit request. Excerpts are contiguous portions of individual reviews, with no combined or invented quotations. Relative dates such as "50 weeks ago" were not converted into invented dates; review dates and profile images are not displayed.

Rech is excluded. The duplicate Simon Beckett screenshot is represented once. The selection includes explicit adult perspectives, a returning drummer, beginners, skill-sensitive teaching, musical/performance development and two parent perspectives. Ages and experience levels are not assigned where the source does not establish them.

| Reviewer | Exact excerpt used | Why selected |
| --- | --- | --- |
| Alan Willmore | As a more 'senior' student (60+), I was somewhat apprehensive about taking up a musical instrument. From day one Dave was great. He understood my concerns and worked with me to establish a baseline to work from. | Explicit adult learner (60+); reassurance and an individual starting point. |
| KZ S | I hadn’t played in almost 30 years and decided to get back into it, and I couldn’t be happier with the progress I’ve made under Dave’s guidance. | Returning drummer after a long break; renewed progress. |
| Steve Muir | He instinctively knows what you need to work on and adapts each lesson so you get the most out of it as possible. | Personalised teaching and targeted development without assuming an age or skill level. |
| Tormey Sheehan | Dave is an excellent teacher. The lessons feel very personal and the teaching is communicated in a way that makes it easy to understand especially if you are a beginner. | Clear explanations and support for beginners. |
| Holly Daisy | David is a highly knowledgeable teacher and has made learning drums so fun and simple, while keeping it challenging for my level of skill. | Enjoyment alongside an appropriate level of challenge. |
| Helena Geoghegan | I was scared starting off as I’m no kid but Dave had been amazing. The way he teaches has given me confidence and enthusiasm to continue and I can’t wait for the next lesson! | Explicit adult perspective; confidence and motivation. Original wording, including "had been", is retained. |
| Simon Beckett | Dave provides awesome drum lessons with online lesson plans that makes practice intentional and rewarding | Structured practice and lesson planning; historical service context is stated beside the carousel. |
| MG Fun | I love the drum lessons! I went from barely keeping time to playing on stage. | Concrete musical development from timing to performance. |
| Kellie Swain | Our son has been going to Dave Drums for nearly three years now, and he absolutely loves it! His progress has been incredible, he has come such a long way and is now a solid, confident drummer. | Parent perspective on long-term progress, confidence and enjoyment. |
| Samantha Kraus | My 15yo son has been taking lessons with Dave for about a year, and his progress is absolutely amazing. | Parent of a teenager; sustained learning and progress. |

The historical-service context paragraphs have been removed at the latest request. No AggregateRating or Review JSON-LD was added; the five-star labels are individual verified source ratings, not a claimed current business average.

## Carousel implementation

- Two groups of five follow The Approach and Learn with a Working Drummer. Only the first displays WHAT STUDENTS SAY. Each section remains accessibly named.
- Helena Geoghegan was swapped into the first group; Holly Daisy is in the second. All ten original excerpts remain unchanged.
- Distinct background bands and top/bottom borders separate the groups from the adjacent charcoal sections. Cards keep subtle borders and rounded corners; ratings use larger gold stars.
- Side arrows sit centrally at the left and right of each rail. Desktop gutters keep them beside the cards; mobile arrows overlap the card edges with padding to keep text clear. Each button has a 44px target.
- Three cards show above 900px, two from 601-900px and one at 600px or below. Quotes remain fully readable in native horizontal scroll rails.
- Automatic scrolling is restored at the latest request: visible rails advance one card every ten seconds, reversing at the ends. Hover, focus, pointer interaction, background tabs and offscreen sections pause it. Manual arrows, rail arrow keys, Home/End and native touch/wheel scrolling remain available; movement resumes after a fresh ten-second delay once interaction ends. Reduced motion disables autoplay and uses immediate arrow scrolling. No pause/resume button was reintroduced.
- Native scrolling remains available without JavaScript. Enhancement controls remain hidden until initialisation.
- The lessons-page tools/notation paragraph was removed at the latest request.

## Restored notation page

Canonical URL: **https://www.davedrums.com.au/notation/karnivool-drone**

Static source: `notation/karnivool-drone.html`.

The old page/path and the supplied Soundslice identifier were not found in the available repository history (52 commits across the locally available refs). The page was reconstructed from the supplied brief using the current design system. No unrelated historical page or transcription was substituted.

The existing public GitHub Pages host was checked: extensionless aliases for existing `.html` files return HTTP 200 with HTML content. The notation source follows that same convention. `scripts/serve.py` mirrors extensionless HTML lookup locally, so the exact requested URL resolves without an added slash, `.html` suffix or JavaScript redirect. The physical `.html` alias serves the same document with a canonical pointing at the requested clean URL.

The page includes:

- KARNIVOOL – DRONE as its H1 and Drum Notation & Transcription as its subheading.
- The rights-holder notice beneath the title/subheading. The visible description, separate artist-attribution sentence and both below-player buttons were removed at the latest request.
- The same generated header/footer and the single shared stylesheet. No main navigation item was added. The temporary notation index was removed at the user's request; `/notation/` is intended to return 404 without a transcription listing.
- A full-width player within the content area, at least 500px high on desktop, with responsive mobile sizing and a descriptive iframe title.
- Title: Karnivool – Drone Drum Notation | Dave Drums.
- Description: Drum notation and transcription for "Drone" by Karnivool in an interactive Soundslice player. Explore the drum sheet music with Dave Drums.
- Canonical, Open Graph/Twitter metadata, existing valid social-image assets, WebPage/Person/WebSite/BreadcrumbList JSON-LD, and an exact sitemap entry. The contextual lessons link and below-player lessons button were removed at the latest request.

Exact iframe source:

**https://www.soundslice.com/slices/jXQqc/embed/**

No sheet music was copied out of the player or reproduced in local assets. The iframe retains the exact supplied embed URL. No below-player fallback or lessons buttons remain.

## Soundslice verification and remaining issue

The bare embed request returned HTTP 200 but contained "Failed embed allowlist check". A follow-up request using the actual production origin (`https://www.davedrums.com.au/`) as its referrer returned approximately 126 KB of player HTML with no allowlist failure. A request using the local preview origin (`http://127.0.0.1:4173/`) remained blocked by the allowlist.

This confirms a successful production-origin HTTP response, not end-to-end browser playback. The iframe explicitly retains `strict-origin-when-cross-origin`, which supplies the origin needed by the allowlist. No account settings were changed.

To enable local player testing, the slice owner can add `127.0.0.1` and/or `localhost` to the Soundslice embed allowlist. There is no evidence from this check that the production domain needs changing. Soundslice documents these requirements in its [embed allowlist guide](https://www.soundslice.com/help/en/embedding/basics/49/allowlists/).

## Verification completed

- Source audit: eight HTML pages, seven canonical sitemap URLs, zero errors. Titles/descriptions, canonical mapping, JSON-LD syntax/relationships, headings, local resources, IDs/ARIA references and internal links pass the repository checker.
- Navigation generator: all eight pages in sync. No navigation links or existing routes were removed.
- Local HTTP: all existing pages, both notation aliases, the stylesheet, the new carousel script and sitemap returned 200. `/notation/karnivool-drone` returns `text/html` at that exact address; it contains the exact supplied embed URL.
- Ten card excerpts and names were compared with the selected screenshot transcription; all ten match. Each card carries its verified five-star label. No Rech review or duplicate Simon card is present.
- Updated isolated script tests cover independent side-arrow navigation, rail arrow/Home/End keys, end-of-rail disabled states, reduced-motion scrolling and resize handling. Additional checks cover independent ten-second timers, end reversal, interaction pauses, reduced motion, document visibility and offscreen suspension.
- Existing enquiry forms and existing page titles, descriptions, canonical URLs and JSON-LD were compared with the pre-change source and remain unchanged. Existing runtime scripts, tool integrations and assets were preserved.
- Follow-up checks verified the five/five section order, unique IDs, all ten gold-star entities and corrected review punctuation. Multi-instance script tests checked independent manual navigation and reduced-motion behaviour.
- `git diff --check` passed.

## Verification limits

The browser access host is unavailable in this environment. Consequently desktop/mobile card rendering, native touch swiping, actual animation smoothness, page overflow, full navigation interaction and Soundslice audio/playback controls could not be verified visually. The carousel tests use a mocked document; they do not substitute for those checks. No enquiries were submitted or external accounts changed. No performance gains, rankings or completed deployment are claimed.

Before deployment, check the two updated pages at desktop/tablet/mobile widths, including 320px; verify side-arrow placement, keyboard/touch navigation, full quote readability and the original enquiry form. Check Soundslice interaction after permitting the local preview origin, or on the already-allowed production origin following a separately authorised deployment. The current live notation URL was still 404 before these local changes; it has not been deployed by this assistant.

## Files created or modified

| File | Change |
| --- | --- |
| `lessons/index.html` | Ten real review excerpts, two groups of five, independent side-arrow controls/script reference and simplified surrounding content |
| `assets/testimonials.js` | Lightweight enhancement for both independent review groups |
| `assets/styles.css` | Lesson carousel styling, notation page/frame styling and shared responsive rules |
| `notation/karnivool-drone.html` | Restored notation page at the original clean URL |
| `sitemap.xml` | Added the notation canonical |
| `scripts/audit-seo.py` | Recognises the clean notation canonical and extensionless HTML link targets |
| `scripts/serve.py` | New local static preview matching the host's extensionless HTML behaviour |
| `README.md` | Current preview command, page/source map and implementation notes |
| `TESTIMONIALS-NOTATION.md` | This source, selection and verification report |

Follow-up: the temporary `notation/index.html` and its sitemap entry were removed. The supplied preview server returns the shared 404 document with status 404 at `/notation` and `/notation/`; the direct Drone transcription remains accessible. VS Code Live Server may still generate a folder listing, so use the supplied preview server to verify this response.
