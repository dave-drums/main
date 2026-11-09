# Dave Drums

Website and free tools for **www.davedrums.com.au**, maintained in this one repository.

## Where to edit

| Folder | Purpose |
| --- | --- |
| `index.html`, page folders | Public website pages |
| `assets/` | Shared stylesheet, fonts, icons and browser JavaScript |
| `apps/metronome/` | Editable React Metronome source and unit tests |
| `apps/groovelab/` | Editable Groove Lab source, notation/MIDI libraries and drum soundfonts |
| `rudiments/`, `assets/rudiments*.js` | Rudiment Trainer page, patterns, engraving and playback |
| `img/` | Website photography and release artwork |
| `help/` | Independent HELP site with its own assets |
| `build/` | Build, preview and asset-sync utilities; authoring tools and configuration |
| `tests/` | Website behaviour, integration and browser checks |
| `.github/workflows/` | Automated checks and GitHub Pages deployment |

Use `assets/styles.css` for website typography, colours, layouts and shared tool
components. Shared tool fonts, icons, themes, timer and tempo helpers are exported
automatically into the app source folders. Those generated copies are ignored by
Git; edit the originals in `assets/`.

Rudiment Trainer runs directly from its page and `assets/rudiments*.js`; it does
not need a generated `/app/` directory. Metronome's compiled bundle and Groove
Lab's isolated document use those generated directories.

## Run locally

Install Node.js 22.12 or newer, then run these commands from this folder:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4177/**. Tool changes rebuild automatically; refresh the
browser after saving. VS Code Live Server works after `npm run build:tools`.

```sh
npm test                 # Tool and website behaviour checks
npm run build            # Build and verify the complete website
npm run preview          # Preview dist/ on port 4178
npm run test:browser     # Browser checks against a built site; needs Playwright Chromium
```

## Source, generated files and private material

- **Commit source and build/check tooling.** Licences, tests and the dependency
  lockfile are useful repository files, even though visitors never download them.
- **Never edit or commit generated output:** `dist/`, `metronome/app/`,
  `groove/app/`, shared exports inside `apps/`, and `node_modules/` are ignored.
- **Private notes and archives belong in `.local/`.** This entire folder is
  ignored and excluded from the production build. `AGENTS.md` holds concise local
  agent conventions; `.local/PROJECT.md` holds current owner preferences.
- Older design reports, redundant checks and unused imported assets are preserved
  under `.local/archive/cleanup-2026-11-08/`. They are historical material, not
  current implementation instructions. Local archives need a separate backup if
  you want to preserve them outside this computer.

## Publish

In this repository's GitHub **Settings → Pages**, select **GitHub Actions** as the
source before pushing the consolidated site. Commit and push **this repository**.
The workflow installs pinned dependencies, checks the apps, builds `dist/`, runs
browser checks, and publishes only that output. `CNAME` at the root is the domain
source; `dist/CNAME` is generated from it.

The production build also minifies the shared stylesheet. Keep editing the
labelled, readable source in `assets/styles.css`; do not edit `dist/`.

The public tool URLs remain `/metronome/`, `/groove/` and `/rudiments/`. Groove
sharing uses `/groove/?...`; exported notation embeds use
`/groove/app/GrooveEmbed.html?...`. Old sibling repositories remain backups;
new tool maintenance belongs here.

## Less frequent authoring tasks

Python 3.11+ is required only for these optional authoring checks:

```sh
python build/authoring/audit-seo.py
python build/authoring/sync-navigation.py --check
python build/authoring/sync-videos.py --check
```

Edit `build/config/navigation.json` or `build/config/videos.json`, then run the
matching sync command without `--check` to update the static page markup.
`build/authoring/build-icons.py` regenerates the icon sprite from an explicitly
supplied Lucide source folder; existing website builds do not need that source.

The main website, Metronome, Groove Lab and bundled libraries retain their
respective licence/attribution files. Keep those notices with the code.
