# openwrt.org website

Hugo source for openwrt.org's static pages — homepage, news, project info,
security advisories, the search-first downloads picker, and the Table of
Hardware browser. The wiki at `openwrt.org/docs/` (and subdomains like
`forum.openwrt.org`, `downloads.openwrt.org`) is separate; this repo is only
the static parts of the site.

## Prerequisites

- **Hugo** (extended build, ≥ 0.139). `brew install hugo` on macOS, or grab a
  release tarball from <https://github.com/gohugoio/hugo/releases>.
- **jq** for `scripts/split-toh.sh`. `brew install jq` / `apt install jq`.
- **curl** to fetch the upstream device list (already on most systems).

That's it — no Node, no package manager, no build step beyond Hugo.

## One-time local setup

The downloads page and `/toh/` need data that isn't in the repo (it's
fetched fresh on every CI build). Run once before the first `hugo server`:

```sh
mkdir -p static/toh
curl -fsSL -A "Mozilla/5.0" https://openwrt.org/toh.json -o static/toh/data.json
sh scripts/split-toh.sh
```

The first command grabs the wiki's Table-of-Hardware export (the User-Agent
matters — `openwrt.org` rejects bare `curl/x.y` UAs with a 503). The second
splits it into `static/toh/devices/{profile_id}.json`, one file per device.
Both `static/toh/data.json` and `static/toh/devices/` are gitignored.

You'll want to re-run those two commands periodically to pick up new
devices (CI runs them on every deploy).

## Local development

```sh
hugo server
```

Serves the site on <http://localhost:1313/> with live reload. Editing
content in `content/`, layouts in `layouts/`, or styles in
`assets/css/main.css` reloads in the browser automatically.

A few page-specific notes:

- **`/downloads/`** fetches `https://downloads.openwrt.org/.versions.json`
  and `/.overview.json` live from the browser. Both are CORS-permissive.
  No special setup needed.
- **`/toh/`** reads `static/toh/data.json` directly (after a same-origin
  fallback chain). If you skipped the split step, the page will show an
  error.

## Building for production

```sh
hugo --minify --gc
```

Writes the rendered site to `public/`. To preview the production build
locally:

```sh
python3 -m http.server -d public 8000
```

…and open <http://localhost:8000/>.

## Deployment

Pushing to `main` triggers `.forgejo/workflows/deploy.yml` on Codeberg.
The workflow:

1. Checks out the repo.
2. Installs the pinned Hugo version.
3. Curls `toh.json`, runs `scripts/split-toh.sh`.
4. Runs `hugo --minify --gc`.
5. Publishes `public/` to Codeberg Pages via `actions/git-pages@v2`.

Edit the `site:` URL in `deploy.yml` if you fork — by default it points at
the upstream Codeberg Pages site.

## Repo layout

```
content/      — Markdown pages (project info, news, security, etc.)
data/         — Hugo data files (data/releases.toml drives the support table)
layouts/      — Hugo templates and partials
assets/       — CSS and JS that go through Hugo's pipeline (fingerprinted)
static/       — Files served verbatim (favicons, logos, archives, toh data)
scripts/      — Helper scripts (split-toh.sh)
deploy/       — Sample nginx config for the eventual openwrt.org server
.forgejo/     — Codeberg CI workflow
hugo.toml     — Hugo config (baseURL, menu, params)
```

## Contributing

- Match the existing style — vanilla JS, no frameworks, OpenWrt brand
  colours from the styleguide (cyan `#00B5E2`, navy `#002B49`).
- News posts go in `content/news/` with a `YYYY-MM-DD-slug.md` filename
  and a `date:` in the frontmatter.
- Release transitions (new stable, EoL) are recorded in
  `data/releases.toml` — that one file feeds the support-status table on
  `/security/` and the version dropdown on `/downloads/`.
- Issues / PRs against the OpenWrt website live in this repo's tracker on
  Codeberg.

## License

Site source: see [`/license/`](content/license.md). Content under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) unless
noted otherwise. OpenWrt logos and marks belong to the project — see the
[trademark policy](https://openwrt.org/trademark).
