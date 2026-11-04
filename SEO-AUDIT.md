# Dave Drums SEO audit and local optimisation

Audit date: 4 November 2026 (Australia/Sydney).

All implementation was performed in the main Dave Drums repository. I did not run commit, push or deployment commands, change external accounts, or modify the separate GrooveScribe application repository. Repository history advanced independently during the task: commits `4874a60`, `c066042` and `30c8be5` appeared without this assistant initiating them. That history was left intact; any external push/deployment activity was not verified. Live HTTP checks describe the deployed responses at the time of checking, not an assistant-initiated deployment of these edits.

## Completed changes

- Reworked titles and descriptions for Home, Drum Lessons, Drum Recording, Metronome and Groove Lab around each page's purpose. Aligned their Open Graph, Twitter/X and WebPage metadata. Recording Terms already had suitable unique metadata and retains it.
- Made Melbourne more explicit in the homepage introduction and clarified session drumming and recording coverage across Australia and worldwide. Added relevant links from the biography to the service pages.
- Made Campbellfield more prominent in lesson metadata and introductory copy. Expanded the existing location section, with the requested northern Melbourne catchment described as places students travel **from**, not additional teaching locations.
- Preserved the accurate biography: around 30 years playing; seven years running Dave's own drum school in Cairns; more than 50 students; progressive rock, metal, fusion, funk and groove; recording and mixing experience. Changed the short statistical label from “Years teaching” to “Years running my drum school” to make the seven-year claim precise.
- Added short, static HTML instructions below Metronome and Groove Lab. Features were checked against the live application source: BPM adjustment, tap tempo and subdivisions for Metronome; drum-grid editing, notation, playback, sharing, printing and downloads for Groove Lab. Added connection/JavaScript guidance and a direct editor fallback link.
- Added useful contextual links between practice tools, lessons, the biography and recording. Recording visitors can use Groove Lab to sketch a pattern for an enquiry.
- Extended structured data with BreadcrumbList on the five non-home indexable pages; WebApplication entities for both tools; explicit tool publisher/site relationships; language declarations; and homepage section relationships for About and Contact.
- Represented the actual Campbellfield teaching location through Service → availableChannel → serviceLocation, using Place and the verified locality/state/country only. Detailed lesson service areas match the visible location copy.
- Corrected the teaching photograph's declared height on Home and Lessons from 575px to its actual 574px WebP height. Width remains 1000px. No image files were altered.
- Added a dependency-free source audit command and documented it in README.

Descriptive titles, helpful visible content and relevant HTML links follow Google's [title guidance](https://developers.google.com/search/docs/appearance/title-link), [snippet guidance](https://developers.google.com/search/docs/appearance/snippet) and [internal-link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable). Titles and snippets remain Google's choice; these changes do not guarantee particular rankings or wording in results.

## Actual page inventory and final metadata

All URLs below were mapped from existing repository files. Six pages remain indexable, with self-referencing canonicals. `404.html` remains excluded from indexing and has no canonical. No pages were created, removed or renamed.

| URL | Primary target intent | Final SEO title | Final meta description |
| --- | --- | --- | --- |
| https://www.davedrums.com.au/ | Melbourne drummer; professional drummer Melbourne; session drummer Melbourne | Melbourne Drummer, Recording & Drum Lessons \| Dave D'Amore | Melbourne drummer Dave D'Amore offers session drumming, remote acoustic drum recording and private drum lessons in Campbellfield, Melbourne's northern suburbs. |
| https://www.davedrums.com.au/lessons/ | Drum lessons Campbellfield; drum lessons Melbourne; private drum lessons northern Melbourne | Drum Lessons Campbellfield, Melbourne \| Dave Drums | Private drum lessons in Campbellfield, Melbourne's northern suburbs, with Dave D'Amore. One-on-one tuition for beginners to advanced drummers, ages 10+. |
| https://www.davedrums.com.au/recording/ | Drum recording Melbourne; session drummer Melbourne; remote drum recording Australia | Drum Recording Melbourne & Remote Sessions \| Dave Drums | Melbourne session drummer Dave D'Amore records acoustic drum tracks for artists across Australia and worldwide. Choose raw multitracks or mixed stereo stems. |
| https://www.davedrums.com.au/metronome/ | Free online metronome; BPM metronome; metronome with subdivisions | Free Online Metronome with Subdivisions \| Dave Drums | Practice with a free online BPM metronome for drummers and musicians. Set your tempo, use tap tempo and explore subdivisions in your browser. |
| https://www.davedrums.com.au/groove/ | Free drum groove maker; online drum groove maker; drum notation editor | Groove Lab \| Free Drum Groove Maker & Notation Editor | Create, edit, play and share drum grooves with Groove Lab, a free online drum groove maker and notation editor. Print your notation or download your work. |
| https://www.davedrums.com.au/recording/terms.html | Dave Drums recording terms; session recording conditions | Session Recording Terms & Conditions \| Dave D'Amore | Session recording terms and conditions for drum recording with Dave D'Amore, including booking, payment, deliverables and revisions. |
| https://www.davedrums.com.au/404.html | No search target; `noindex, follow` | Page Not Found \| Dave Drums | This Dave Drums page could not be found. Return home, explore drum lessons and acoustic drum recording, or get in touch with Dave. |

**About** is `https://www.davedrums.com.au/#about`; **Contact** is `https://www.davedrums.com.au/#contact`. They share the homepage's title, description and canonical, rather than being separate documents. About supports searches for Dave D'Amore, Melbourne professional drummer and drum educator Melbourne through the visible biography and Person data. Neither fragment belongs in the XML sitemap as a separate page.

The main H1s retain their existing editorial treatment: Dave D'Amore, Drum Lessons, Drum Recording, Metronome, Groove Lab, Terms & Conditions and 404. Location and purpose are stated in adjacent visible copy, titles and secondary headings without changing the large heading layouts. Every document has one H1 and a sequential heading hierarchy.

## Northern Melbourne targeting

The lesson location heading now reads “Drum Lessons in Campbellfield & Melbourne's Northern Suburbs”. Two short paragraphs describe travel to the Campbellfield studio from Broadmeadows, Fawkner, Glenroy, Hadfield, Pascoe Vale, Coolaroo, Meadow Heights, Dallas, Thomastown, Lalor, Reservoir, Coburg, Preston, Epping and Craigieburn. The same catchment is represented by Place names in the dedicated lesson Service data.

Campbellfield remains the only stated physical teaching location. The lesson introduction retains one-on-one tuition, ages 10+, and beginner-to-advanced suitability. No street address, additional studio, travel time or transport claim was invented. Suburb targeting is concentrated in this useful section, rather than repeated around the site or turned into doorway pages. “Near me” intent is supported through accurate location context, not repeated as a phrase.

No suburb-specific pages are recommended at present. Only consider one if there is genuinely distinct information, such as a real additional teaching venue or a substantive local programme. Rewording the same lesson page for each suburb would provide little value and could conflict with Google's [doorway and keyword-stuffing policies](https://developers.google.com/search/docs/essentials/spam-policies).

## Technical audit findings and decisions

| Area | Finding and outcome |
| --- | --- |
| Titles and descriptions | Existing service metadata was broadly sound. Campbellfield, session work and actual tool functions are now clearer. No duplicate titles or descriptions among indexable documents. |
| Social metadata | All indexable pages have matching title/description/URL metadata, valid local social-image files, image alt text and image dimensions. Tool descriptions previously differed between metadata formats; they are now aligned as an editorial consistency improvement. |
| Canonicals | Existing HTTPS `www` canonicals were correct and retained. All four directory pages use trailing slashes; Terms retains its `.html` URL. Query variants of the Groove landing page retain the clean `/groove/` canonical. |
| Sitemap | Existing `sitemap.xml` exactly lists the six actual indexable canonical documents. Retained unchanged. No invented `lastmod`, priority, change frequency, About/Contact fragment URLs or tool query URLs were added. |
| Robots | Existing `robots.txt` allows crawling and advertises the correct sitemap. Retained unchanged. The 404 remains `noindex, follow`; public pages have no blocking directive. |
| 404 | A missing nested live URL returned HTTP 404. Local source uses root-relative styles, scripts, fonts, images and navigation. Directly requesting `/404.html` on Python's preview server returns 200 because it is a real file; that is not a test of GitHub Pages missing-route handling. |
| Links | All local anchor destinations, page fragments, image paths, responsive image candidates, scripts, styles and font URLs passed source checks. Public media/profile links returned HTTP 200 during the spot check; a successful response does not verify media playback or account accessibility. |
| Navigation | Home / About / Services / Tools / Contact and the existing dropdown contents are preserved as static HTML. The navigation generator reports all seven pages in sync. Home's generated header/footer line endings were normalised by the generator. |
| Recording Terms | Its existing canonical, indexability and sitemap entry are retained. The page has deliberately limited internal discovery: no Terms links were added to Home, Recording, header or footer, in accordance with project instructions. All legal clauses are unchanged. |
| Structured data | JSON-LD parses successfully, local entity references resolve in the site's data, breadcrumb sequences and linked URLs are consistent. Local schema.org properties were checked against the official vocabulary. No ratings, reviews, awards, qualifications, contact details, hours or new prices were added. |
| Local business eligibility | No LocalBusiness rich-result claim was added: there is no verified full street address available to satisfy Google's required address information. Person + Service + actual Place is accurate without inventing business details. See [Google's LocalBusiness requirements](https://developers.google.com/search/docs/appearance/structured-data/local-business) and [schema.org's serviceLocation definition](https://schema.org/serviceLocation). |
| Tool markup | WebApplication describes actual features and free access. This is semantic data, not a claim that the apps qualify for Google's software rich results; no offers or reviews were fabricated. |
| Crawlability | Service copy, navigation and new tool instructions are in delivered HTML. The biography is in source and remains readable without JavaScript; its existing disclosure is preserved. Tool operation itself still requires JavaScript. |
| Mobile and semantics | Viewport declarations, `en-AU`, existing responsive breakpoints, focus controls and reduced-motion behaviour are retained. New guide blocks use shared width/spacing tokens and normal document flow. No new fixed-width layout or runtime dependency was added. Rendered mobile/desktop behaviour remains unverified in this audit. |
| Images | All 26 image occurrences have alt attributes and dimensions; image and `srcset` files resolve. Header/footer logos and social images are valid. Existing eager/high-priority hero images and lazy below-fold photographs/artwork are preserved. The 1px teaching-image height discrepancy was corrected. |
| Fonts and resources | Existing self-hosted WOFF2 fonts use `font-display: swap` and preloads. Styles remain in the single shared CSS file; shared scripts are deferred and the metronome loader remains a module. No framework, third-party SEO script, extra stylesheet or build dependency was introduced. |

Google supports canonicals as a consolidation signal, with consistent linking and sitemap URLs. A canonical is not a guaranteed indexing instruction. See [Google's canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

## Groove Lab indexing strategy: local work and remaining action

**Completed here:** `/groove/` remains the preferred main-site landing URL with a self-canonical, sitemap entry, internal links, branded title, useful original HTML instructions and WebApplication data. The iframe still loads `https://groove.davedrums.com.au/`; its query forwarding, permissions, full-screen controls and orientation dialog code are unchanged.

**Observed live:** the standalone application returns HTTP 200, identifies itself as Groove Lab, and has no canonical link or robots meta directive. The inspected response also had no `X-Robots-Tag`, `X-Frame-Options` or Content-Security-Policy header. There is currently no explicit standalone indexing restriction in that response. Actual Google indexing was not verified through Search Console. No duplicate-content penalty is inferred merely from the existence of an iframe.

**Recommended later, outside this task:** make the main `/groove/` landing page the search destination and exclude the standalone shell from independent indexing while allowing its embedded content to be indexed by Google. In a separately authorised application-repository change, add this to the standalone application's HTML head:

```html
<meta name="robots" content="noindex, indexifembedded">
```

Google documents this exact combination for embedded content: [indexifembedded](https://developers.google.com/search/blog/2022/01/robots-meta-tag-indexifembedded). Support for `indexifembedded` varies between search engines; `noindex` excludes the standalone document where honoured. Keep both origins crawlable so Google can read the directive and render the embedding page. Do not put this directive on the main `/groove/` page. Do not redirect the standalone application back into its own embedding page: that could break the integration through recursive framing.

If retaining an independently searchable standalone app is a business goal instead, revisit the strategy before applying `noindex`. A cross-domain canonical to `/groove/` is a softer alternative for sufficiently equivalent content; Google can still choose another canonical. Do not stack contradictory canonical/noindex strategies indiscriminately. **No standalone-app indexing change has been implemented here**, because that repository is explicitly out of scope.

## Verification completed and limits

Completed successfully:

1. `scripts/audit-seo.py`: seven HTML documents, six sitemap URLs, zero source-check errors. It checks tag balance, primary heading count/hierarchy, IDs and ARIA references, metadata consistency/uniqueness, canonicals, JSON syntax/entity relationships, breadcrumb sequences, local links/fragments/resources and shared stylesheet use. This is a focused source checker, not a complete HTML conformance or schema.org rich-result validator.
2. `scripts/sync-navigation.py --check`: all seven pages in sync.
3. `git diff --check`: no whitespace errors.
4. Local HTTP requests: all seven documents, stylesheet and both font files returned 200. All referenced local images/resources also exist on disk.
5. Live HTTP requests: main public documents, both tool endpoints, four Spotify links, four YouTube links and the Instagram link returned 200. HTTP Home, non-www HTTPS Home, and slashless Lessons/Recording/Metronome/Groove each returned a 301 to the expected HTTPS `www` URL. A missing nested URL returned 404.
6. Live `/index.html` remains a 200 alias of Home, with the root canonical. GitHub Pages does not offer arbitrary repository-defined server redirects; consistent root links/canonicals remain the appropriate local treatment. A future proxy/server configuration could add a redirect, but is not necessary for this edit.
7. Exact source comparisons: all three enquiry forms, Recording Terms main content and the Groove iframe element are unchanged. Hash comparisons confirm that `assets/script.js`, `assets/navigation.js`, `assets/groove.js`, `assets/metronome.js`, `config/navigation.json`, `robots.txt`, `sitemap.xml` and `CNAME` are unchanged.
8. The separate GrooveScribe repository had a clean working tree at the initial read-only status check. No commands wrote to that repository; its final status is also clean.

**Browser limitation:** the browser host was unavailable, and native Windows browser access was then blocked because URL-policy enforcement is unsupported for that browser. Computer Use ended at that point. No fallback browser automation was used. Consequently this audit cannot certify desktop/mobile rendering, dropdown interactions, full-screen/orientation handling, audio output, editor interactions, downloads, clipboard sharing, or the absence of unintended visual changes. Source preservation and HTTP availability are evidence of integration continuity, not substitutes for those tests. No enquiry was sent.

No Lighthouse, field Core Web Vitals or before/after load-time measurement was available. No speed or ranking improvement is claimed. Source inspection measured the existing main hero WebP at 237,712 bytes (1920px) and its smaller candidate at 71,350 bytes (960px); the teaching candidates are 126,484 and 55,060 bytes. Both font files total 85,188 bytes. The remote metronome module is approximately 236 KB of uncompressed source and remains externally maintained. Added HTML instructions and JSON-LD increase page source size; this was accepted for useful crawlable content, not presented as a performance saving.

## Manual actions and opportunities, in priority order

1. **Before deployment: browser QA.** Check Home, Lessons, Recording, both tools, Terms and 404 at desktop and mobile widths (including 320px). Check the longer teaching statistic label and lesson location heading, new tool instructions, menu dropdowns/keyboard focus, biography disclosure and FAQs. Start/stop Metronome and change BPM/subdivisions; edit/play/share a Groove Lab pattern, test full screen and rotate a phone. Confirm existing recording gallery links and enquiry form validation without sending a test enquiry unintentionally. Run Google's Rich Results Test and schema.org validator with the edited source when suitable access is available. These checks remain pending.
2. **After an independently authorised deployment: Search Console.** Verify the `davedrums.com.au` Domain property with the required DNS record if not already verified; this includes `www` and subdomains. No placeholder verification token was added. Submit `https://www.davedrums.com.au/sitemap.xml`. Inspect Home, Lessons, Recording, Metronome and Groove, compare declared/Google-selected canonicals, and use live tests to confirm rendered content and permitted resources. Request indexing of materially changed priority pages. Sitemap submission and requests do not guarantee indexing. See [Google's Search Console guidance](https://developers.google.com/search/docs/monitor-debug/search-console-start).
3. **Google Business Profile: highest-priority local opportunity.** Verify an eligible profile; use the real business name, the most accurate available teaching/business category, actual contact details and hours, and a correct website/lesson link. Represent the Campbellfield teaching location only if it meets Google's real-world eligibility/address requirements. Do not create profiles for student catchment suburbs or turn the name into a keyword list. Add authentic teaching/studio photographs and accurate service descriptions. Invite genuine students to leave voluntary, unincentivised reviews without review gating. Local visibility depends partly on relevance, distance and prominence; listing more suburbs does not overcome physical distance. Follow [Google's local-ranking guidance](https://support.google.com/business/answer/7091). No profile/account changes were made.
4. **Resolve standalone Groove Lab indexing** using the separately authorised strategy above; verify both the direct application and embedded landing page in Search Console afterwards. This is the main unresolved cross-repository technical item.
5. **Measure search outcomes.** Record a baseline of impressions, clicks, CTR and enquiries. Review lesson queries for Campbellfield/northern Melbourne, recording/session queries for Australia, and tool queries internationally after recrawling. Compare meaningful periods and account for seasonality; respond to real search demand rather than adding keyword variations indiscriminately.
6. **Build credible local and musical references.** Seek accurate links from genuine collaborators, releases, artist profiles and relevant Melbourne music/community directories. Avoid purchased ranking links, fabricated testimonials or mass directory submissions. Recording credits already provide useful evidence; preserve their accuracy.
7. **Add useful teaching/tool resources only where justified.** Original groove examples, explanations of subdivisions, reading drum notation and practice exercises can serve real queries and link naturally to the free tools and lessons. Use actual teaching expertise, not repetitive suburb pages. Add accessible video/transcripts only when real material exists.
8. **Measure performance before further optimisation.** Use PageSpeed Insights and Search Console's mobile/desktop Core Web Vitals reports after deployment; inspect LCP, INP and CLS separately on service and tool pages. Optimise the measured bottleneck, respecting the external app boundary. Consider better-sized social-preview crops only if actual previews warrant them. See [Google's Core Web Vitals guidance](https://developers.google.com/search/docs/appearance/core-web-vitals).

## Files modified or added

| File | Change |
| --- | --- |
| `index.html` | Metadata/schema; Melbourne/session context; biography links; precise drum-school statistic; image height; generated navigation normalisation |
| `lessons/index.html` | Local metadata/schema; Campbellfield introduction/catchment; contextual practice/about links; statistic; image height |
| `recording/index.html` | Session/remote metadata/schema; Australian/worldwide coverage; biography and groove-brief links |
| `metronome/index.html` | Tool metadata/schema; HTML usage/practice instructions and contextual links |
| `groove/index.html` | Tool metadata/schema; concise description, HTML instructions, direct-editor fallback and contextual links |
| `recording/terms.html` | Breadcrumb/site/person relationships and aligned WebPage schema; main content unchanged |
| `assets/styles.css` | Shared guide typography/spacing using existing tokens; lesson-location paragraph spacing in the lesson section |
| `scripts/audit-seo.py` | New repeatable dependency-free source verification command |
| `README.md` | Source map and SEO/check documentation |
| `SEO-AUDIT.md` | This audit, final metadata, evidence, limits and prioritised recommendations |

Unchanged after review: `404.html`, `sitemap.xml`, `robots.txt`, `CNAME`, navigation configuration, all runtime JavaScript, image/font files and external repositories. The local preview server was stopped after verification.
