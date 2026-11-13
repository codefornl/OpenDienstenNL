# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
OpenDienstenNL is a Jekyll-based static website that showcases open source SaaS services. It's designed to run on GitHub Pages and presents a curated directory of privacy-friendly alternatives to mainstream services.

## Development Commands

### Local Development
```bash
# Install Jekyll dependencies (first time setup)
bundle install

# Run local development server
bundle exec jekyll serve

# Build the site locally
bundle exec jekyll build
```

### Deployment
- Push changes to GitHub main branch
- GitHub Pages automatically builds and deploys the site

## Architecture & Key Components

### Data Structure
All data is JSON, validated by the JSON Schemas in `_data/schemas/<naam>.json` (in `_data` so Liquid can read them; published at `/schemas/<naam>.schema.json` by `pages/schemas/`, explained on `/gegevensmodel`). See `docs/ARCHITECTURE.md`.
- `_data/profielen/open-diensten.json`: the catalogue ("Alle diensten"): the open services plus well-known services that are not open (Slack, GitHub, LinkedIn, … with `open: false` and `redenen`), itself a profile (`profiel.schema.json`). The Diensten page shows everything from all profiles (`_includes/data/overzicht.html`): per category one grid (`organisms/category-services.html`): first the open services, then what is not open, each with the logos of the organisations that use it (`molecules/used-by.html`). Each service follows `dienst.schema.json`: `id` (stable, never change it; profiles reference it), `naam` (the service = where it lives, e.g. `social.codefor.nl`; never the software name), `categorie`, `url`, plus `software` (id in `_data/software.json`), `aanbieder` (id in `_data/organisaties.json`), `beheer` (id of the organisation running it as a managed service, e.g. `procolix`), `soort` (`dienst` default, or `infrastructuur` for domain names/newsletters: no open-dienst judgement, not in Start or the autonomy meter; `rp_infra`/`ov_infra`), `beschrijving`, `favicon`, `random_url`, `spoelkeuken_url`, `eu_hosting`, `doelgroep` (only if not for everyone, e.g. `overheden`), `status` (live/disabled/discontinued), `open` (default true), `redenen` (when `open: false`: account/betaald/gesloten/buiten-eu).
- `_data/profielen/<id>.json`: organisation profiles. `diensten` is a list of full services or references `{"ref": "<id>"}` (to Alle diensten, or `"bron": "<profile url>"`). A reference to a service that is not open may have the organisation's own `"url"` (e.g. their LinkedIn page; `rp_eigen` in the resolver); open services never do. Order within a category = preference. Services with `open: false` are shown as the same service card with their reasons as labels, after the open services. The thick black border (`.is-uitfaseren`) is only in a profile, for a service the organisation itself wants to phase out (`"uitfaseren": true`, `rp_uitfaseren`); such a service is not in the general overview; on Diensten closed-source ones only if a profile uses them ("foute opties komen uit profielen"), open-source ones (Signal, Element) always. Start never chooses them, and `liveServices` in JS excludes them. Profiles are only added on request of the organisation (no concept/confirmed label).
- `_data/software.json` and `_data/organisaties.json`: the software services run on (`id`, `naam`, `logo`, `website`, `broncode`, `open_source`; only software you can run or install, not things that only exist as a service like Slack) and the organisations that offer them (`id`, `naam`, `website`, `logo`, `land`), with their own schemas, published at `/software.json` and `/organisaties.json`. Services reference them by id; the two logos on a card come from there (big: software logo, small: provider logo; a service without software keeps its own `favicon`); `_includes/data/dienst.html` looks them up (`dn_sw`, `dn_org`), and `/diensten.json` gives JS the names filled in (`aanbieder`/`software` as names, plus `aanbieder_id`, `software_id`, `aanbieder_favicon`).
- `_software/<id>.md` and `_aanbieders/<id>.md`: one stub per software and per organisation (collections `software` and `aanbieders`, layouts `software` and `aanbieder`, pages `/software/<id>/` and `/aanbieders/<id>/`); create missing ones with `ruby scripts/profielen.rb paginas`. `/software/` and `/aanbieders/` list them; the nav items Software and Aanbieders are at the bottom, under "Wat is een open dienst?". On a card "Nextcloud door Disroot" (software and provider, each linked to its page) sits under the name, next to their logos; the category badge is orange in the top right corner; always all five labels (`molecules/dienst-tags.html`, `dienstTags()` in JS; `controleer` checks the data for them is complete): ✓ (green) or ✗ (red) with the same text: open source, europees, gratis (✗ if `betaald`), geen login, voor iedereen (`doelgroep`; Start skips those unless a profile chose them) (no flags); the card itself is a `div` whose title link (`a.card-link`) is stretched over the card. The strip under the card (`molecules/service-strip.html`) always shows who uses it ("nog geen profiel" if nobody). `/gegevensmodel` (`pages/gegevensmodel.html`) explains all data, with field tables generated from the schemas (`organisms/schema-table.html`).
- `_data/profielregister.json`: which profiles exist and where (`standaard` = open-diensten). Our own profiles live at `https://opendiensten.nl/profielen/<id>.json` (published by `pages/profielen/<id>.json`; add one for a new own profile). External URLs are fetched nightly by `.github/workflows/profielen.yml`.
- `ruby scripts/profielen.rb controleer` validates everything (schemas, references to profiles, software and organisations, duplicate ids, no HTML in text); run it after editing data. `ruby scripts/profielen.rb ophalen` fetches external profiles.
- `_includes/data/profiel.html` resolves a profile (sets `rp`, `rp_shown`, `rp_open`, `rp_closed`, `rp_cats`); Liquid variables are global, so read them right after the include.

### Directory Structure
- `index.md`: Homepage (stays in the root, Jekyll convention)
- `pages/`: All other standalone pages and endpoints (`profiel-toevoegen.html` = how to add a profile, `/profielen/toevoegen`; `geschiedenis.md` = Geschiedenis, `over.md` = Wat is een open dienst?, `credits.html` = redirect to `/over`, `design-system.html`, `start-*.md`, `api.json`, `diensten.json`, `manifest.json`). Every file here needs an explicit `permalink` in its front matter, otherwise its URL would include `/pages/`.
- Profiles are a filter on Diensten: `/?profiel=<id>` (`js/opendienstenapp.js` shows the hidden per-profile blocks rendered by `organisms/services-by-category.html`); `/profielen/` shows a tile per profile.
- `pages/doorverwijzingen/`: old category URLs (`/videobellen`) redirect to the anchor on Diensten (`/#videobellen`), layout `doorverwijzing`; start pages are only `pages/start-*.md`
- `_data/`: profiles and register (see Data Structure); `_data/schemas/`: JSON Schemas; `scripts/profielen.rb`: validate and fetch profiles (not published)
- `_layouts/`: `default.html` (supports `stylesheets` and `footer: true` in front matter) and `start.html` (start pages: choose, open, share and rate an open service)
- `_includes/atoms/`, `_includes/molecules/`, `_includes/organisms/`: Design system components (atomic design), documented at `/design-system/` — not public: excluded in `_config.yml`, view locally with `bundle exec jekyll serve --config _config.yml,_config.local.yml`
- `css/style.css`: Design tokens + components, Apitecture branding; used by everything on `_layouts/default.html` (homepage, design system, start pages)
- `css/design-system.css`: Styling for the design system page itself
- `assets/images/`: All images. The OpenDiensten logo in `assets/images/logo/`: `opendiensten.svg` (light backgrounds, used by `molecules/brand.html`), `-oranje.svg` (on orange, the offline screen), `-zwart.svg` (white, on dark), `-logo.svg` (large, three hexagons); `favicon.svg` is the hexagon from the logo without text. Partner logos in `assets/images/logos/`
- `assets/fonts/`: Self-hosted fonts (Atkinson Hyperlegible Mono)
- `js/`: Client-side modules: `ServicesManager` (data, cards, sorting by rating, roulette wheel, unique URLs), `HistoryManager` (sessions in localStorage), `opendienstenapp.js` (Diensten), `geschiedenis.js` (Geschiedenis), `start.js` (start pages), `nav.js` (unrated count, marks the category heading in view)
- `docs/`: Project documentation (architecture, contributing, category mapping); not published. Read `docs/ARCHITECTURE.md` for the concepts (open dienst, aanbieder, EU) and the start flow.

### Frontend Architecture
- **Server-rendered, JS-enhanced**: `index.md` renders every category as a heading with its cards (`organisms/services-by-category.html`); `js/ServicesManager.mjs` re-sorts each category by rating. A profile (`?profiel=`) is the same page filtered in JS. JS-built markup (cards, history) must match the includes.
- **Visibility**: Toggle views, buttons and the rating dialog with the `hidden` attribute, not `style.display`
- **Privacy**: "Geschiedenis bijhouden" is OFF by default (unique links are secret). Off: no sessions stored, Geschiedenis hidden from the nav, ratings only as anonymous counts per service (`opendienstenBeoordelingen`). Turning it off wipes the sessions. See `js/HistoryManager.mjs` and the Opslag section in `docs/ARCHITECTURE.md`.
- **Navigation**: Sidebar = where you are and what you can do: brand, intro, the switch "Geschiedenis bijhouden", start buttons, main nav in three groups (`li.nav-group`): Diensten `/` and Geschiedenis `/geschiedenis` (only when kept); Profielen `/profielen/`, Software `/software/`, Aanbieders `/aanbieders/`; Wat is een open dienst? `/over` and Voor ontwikkelaars `/ontwikkelaars` (tile to `/gegevensmodel`; the design system is not public); partners at the bottom. Under Diensten the categories are anchors to the headings on `/` (`organisms/category-menu.html`); Profielen has no submenu (a profile is a filter on Diensten); on mobile the categories are a row of chips.
- **Service Cards**: Grid layout with hover effects
- **Responsive Design**: Mobile-friendly CSS

### Adding/Modifying Services
1. Edit `_data/profielen/open-diensten.json` (an organisation's own choice goes in its profile)
2. Run `ruby scripts/profielen.rb controleer`
3. Test locally with `bundle exec jekyll serve`
4. Commit and push to deploy

### Common Tasks
- **Add new service**: Add it to `_data/profielen/open-diensten.json`; categories follow automatically from `categorie`
- **Add a profile**: Add `_data/profielen/<id>.json` and an entry in `_data/profielregister.json` (own profiles also need `pages/profielen/<id>.json`); or register the organisation's own URL
- **Update styling**: Use tokens in `css/style.css`
- **Add a page**: Add it to `pages/` with a `permalink`
- **Add a component**: Add an include under `_includes/atoms|molecules|organisms/` and a specimen on `pages/design-system.html`
- **Change layout**: Edit `_layouts/default.html` or `index.md`

## Important Notes
- **Offline:** `offline: true` in `_config.yml` makes every page (`_layouts/default.html`) show only an orange "Even offline" screen, with noindex. Set it to `false` to publish. Locally `_config.local.yml` sets `offline: false`: `bundle exec jekyll serve --config _config.yml,_config.local.yml`.
- Made by Apitecture ("gemaakt door" in the sidebar and footer); not a collaboration with Code for NL any more (Code for NL is only a profile and an organisation in the data).
- Data is CC0 (`_data/LICENSE.md`), code EUPL-1.2. A prototype banner sits on every page (`molecules/prototype-banner.html`) until the data has been checked.
- No requests to third parties from the browser: all logos are local in `assets/images/iconen/` (`ruby scripts/profielen.rb iconen` downloads new external ones; `controleer` warns about external ones).
- No build tools (npm, webpack) - pure Jekyll workflow; only `scripts/profielen.rb` (plain Ruby) to validate and fetch profiles
- No formal testing framework
- GitHub Pages handles all deployment automatically
- All data changes go in `_data/profielen/` and `_data/profielregister.json`, validated by `scripts/profielen.rb controleer`
- The site uses vanilla JavaScript for interactivity (no frameworks)