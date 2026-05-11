// Downloads page (search-first device picker).
//
// Data flow (no wiki dependency for the device list):
//   1. window.OPENWRT_RELEASES (server-rendered from data/releases.toml
//      via the {{< releases-data >}} shortcode) → release dropdown.
//   2. /releases/{ver}/.overview.json → list of profiles (search index).
//   3. On row expand:
//        a. /toh/devices/{id}.json (per-device snapshot of toh.json,
//           produced by scripts/split-toh.sh in CI) → specs.
//        b. /releases/{ver}/targets/{target}/profiles.json → image URLs.
//
// The release endpoints are CORS-permissive. Snapshot mode (developers
// only) is currently a card-only view because no per-release overview is
// published for snapshots.
(function () {
  const root = document.getElementById('downloads-app');
  if (!root) return;

  const RELEASE_BASE = 'https://downloads.openwrt.org/releases/';
  const NOTES_BASE = 'https://openwrt.org/releases/';
  const SNAPSHOTS_URL = 'https://downloads.openwrt.org/snapshots/';
  const WIKI_BASE = 'https://openwrt.org/';
  // Per-device toh files live next to /toh/. Use document.baseURI so the
  // path resolves correctly under any deploy prefix.
  const TOH_DEVICE_BASE = new URL('../toh/devices/', document.baseURI).href;
  const RESULT_CAP = 30;

  const overviewCache = new Map();   // fullVersion -> overview JSON
  const profilesCache = new Map();   // `${ver}|${target}` -> Promise<profiles JSON>
  const deviceCache = new Map();     // profileId -> Promise<device JSON | null>

  let stable = '', oldstable = '', upcoming = '';
  let currentProfileIndex = []; // built from current overview's `.profiles[]`
  let searchEl, versionEl, allVersionsBtn, resultsEl;
  let allVersionsMode = false;
  let allVersionsList = null; // cached array fetched from .versions.json

  const VERSIONS_URL = 'https://downloads.openwrt.org/.versions.json';

  const releases = window.OPENWRT_RELEASES;
  if (!releases) {
    root.replaceChildren();
    const p = el('p', 'dl-error');
    p.append('Release data missing. Browse ');
    p.appendChild(link('https://downloads.openwrt.org/', 'downloads.openwrt.org'));
    p.append(' directly.');
    root.appendChild(p);
    return;
  }
  stable = releases.stable || '';
  oldstable = releases.oldstable || '';
  upcoming = releases.upcoming || '';
  buildShell();
  onVersionChange();

  // ---- shell ---------------------------------------------------------------

  function buildShell() {
    root.replaceChildren();

    const bar = el('div', 'dl-search-bar');
    searchEl = document.createElement('input');
    searchEl.type = 'search';
    searchEl.id = 'dl-search';
    searchEl.placeholder = 'Search brand or model…';
    searchEl.autocomplete = 'off';
    searchEl.addEventListener('input', renderResults);

    versionEl = document.createElement('select');
    versionEl.id = 'dl-version';
    versionEl.setAttribute('aria-label', 'OpenWrt release version');
    versionEl.addEventListener('change', onVersionChange);
    populateVersions();

    allVersionsBtn = document.createElement('label');
    allVersionsBtn.className = 'dl-all-versions';
    allVersionsBtn.title = 'Show every published patch release and RC';
    const allVersionsCheckbox = document.createElement('input');
    allVersionsCheckbox.type = 'checkbox';
    allVersionsCheckbox.id = 'dl-all-versions-checkbox';
    allVersionsCheckbox.addEventListener('change', toggleAllVersions);
    allVersionsBtn.appendChild(allVersionsCheckbox);
    allVersionsBtn.appendChild(document.createTextNode(' All versions'));
    allVersionsBtn._checkbox = allVersionsCheckbox;

    bar.appendChild(searchEl);
    bar.appendChild(versionEl);
    bar.appendChild(allVersionsBtn);
    root.appendChild(bar);

    resultsEl = el('div');
    resultsEl.id = 'dl-results';
    root.appendChild(resultsEl);
  }

  function populateVersions() {
    // Preserve the user's current selection across rebuilds where possible.
    const prev = versionEl.selectedOptions[0]?.dataset.fullVersion || versionEl.value;
    versionEl.replaceChildren();

    if (allVersionsMode && Array.isArray(allVersionsList)) {
      // Group every published version under its series, latest first.
      const bySeries = new Map();
      for (const v of allVersionsList) {
        const s = seriesOf(v);
        if (!s) continue;
        if (!bySeries.has(s)) bySeries.set(s, []);
        bySeries.get(s).push(v);
      }
      const sortedSeries = [...bySeries.keys()].sort((a, b) => seriesWeight(a) - seriesWeight(b));
      for (const s of sortedSeries) {
        const og = document.createElement('optgroup');
        og.label = `OpenWrt ${s}`;
        for (const v of bySeries.get(s)) {
          const opt = document.createElement('option');
          opt.value = v;
          opt.dataset.fullVersion = v;
          opt.textContent = v;
          og.appendChild(opt);
        }
        versionEl.appendChild(og);
      }
    } else {
      const seen = new Set();
      if (stable)    addVersionOption(versionEl, stable,    seriesOf(stable),    'stable',               seen);
      if (oldstable) addVersionOption(versionEl, oldstable, seriesOf(oldstable), 'security maintenance', seen);
      if (upcoming)  addVersionOption(versionEl, upcoming,  seriesOf(upcoming),  'release candidate',    seen);
    }

    const snapOpt = document.createElement('option');
    snapOpt.value = 'snapshot';
    snapOpt.className = 'dl-snapshot-option';
    snapOpt.textContent = 'Snapshot — developers only';
    versionEl.appendChild(snapOpt);

    // Restore previous selection if still present.
    if (prev) {
      for (const opt of versionEl.options) {
        if (opt.dataset.fullVersion === prev || opt.value === prev) {
          versionEl.value = opt.value;
          break;
        }
      }
    }
  }

  function addVersionOption(sel, fullVersion, series, statusLabel, seen) {
    if (!series || seen.has(series)) return;
    seen.add(series);
    const opt = document.createElement('option');
    opt.value = series;
    opt.dataset.fullVersion = fullVersion;
    opt.textContent = `OpenWrt ${fullVersion} (${statusLabel})`;
    sel.appendChild(opt);
  }

  // Numeric weight for descending semver-ish sort: 25.12 → -2512.
  function seriesWeight(s) {
    const m = /^(\d+)\.(\d+)/.exec(s || '');
    return m ? -(parseInt(m[1], 10) * 1000 + parseInt(m[2], 10)) : 0;
  }

  function toggleAllVersions() {
    const cb = allVersionsBtn._checkbox;
    const wantOn = cb.checked;
    if (wantOn) {
      // Lazy-load the full list on first toggle.
      const ensure = allVersionsList
        ? Promise.resolve(allVersionsList)
        : fetchJSON(VERSIONS_URL).then((j) => {
            allVersionsList = j.versions_list || [];
            return allVersionsList;
          });
      ensure
        .then(() => {
          allVersionsMode = true;
          populateVersions();
          onVersionChange();
        })
        .catch((err) => {
          // Roll the checkbox back so its state matches reality.
          cb.checked = false;
          resultsEl.replaceChildren(
            el('p', 'dl-error', 'Could not load full version list (' + err.message + ').')
          );
        });
    } else {
      allVersionsMode = false;
      populateVersions();
      onVersionChange();
    }
  }

  // ---- version handling / overview load ------------------------------------

  function onVersionChange() {
    const isSnapshot = versionEl.value === 'snapshot';
    versionEl.classList.toggle('dl-snapshot-active', isSnapshot);
    setSearchEnabled(true);

    const fullVersion = isSnapshot
      ? 'snapshot'
      : versionEl.selectedOptions[0]?.dataset.fullVersion;
    if (!fullVersion) return;

    resultsEl.replaceChildren(el('p', 'dl-loading', 'Loading firmware list…'));

    loadOverview(fullVersion)
      .then((data) => {
        // Race check: user may have switched versions while we were fetching.
        if (selectedFullVersion() !== fullVersion) return;
        currentProfileIndex = buildProfileIndex(data);
        renderResults();
      })
      .catch((err) => {
        if (selectedFullVersion() !== fullVersion) return;
        currentProfileIndex = [];
        setSearchEnabled(false);
        resultsEl.replaceChildren(noOverviewNotice(fullVersion, err));
      });
  }

  function selectedFullVersion() {
    return versionEl.value === 'snapshot'
      ? 'snapshot'
      : versionEl.selectedOptions[0]?.dataset.fullVersion;
  }

  function baseUrlFor(fullVersion) {
    return fullVersion === 'snapshot'
      ? SNAPSHOTS_URL
      : RELEASE_BASE + fullVersion + '/';
  }

  function setSearchEnabled(on) {
    searchEl.disabled = !on;
    searchEl.placeholder = on
      ? 'Search brand or model…'
      : 'Search unavailable for this version';
  }

  function noOverviewNotice(fullVersion, err) {
    // Some older releases never had a .overview.json published. Drop a
    // helpful pointer at downloads.openwrt.org so the user can still
    // grab images for that version, even though search is unavailable.
    const wrap = el('div', 'dl-error');
    const base = baseUrlFor(fullVersion);
    const label = fullVersion === 'snapshot' ? 'snapshot' : 'OpenWrt ' + fullVersion;
    const p = el('p');
    p.append('No searchable index for ' + label + ' (' + err.message + '). ');
    p.append('Browse the directory directly:');
    wrap.appendChild(p);
    const ul = el('ul');
    ul.appendChild(buildLi(base + 'targets/', 'Per-target firmware images'));
    ul.appendChild(buildLi(base, 'All ' + label + ' files'));
    wrap.appendChild(ul);
    return wrap;
  }

  function buildLi(href, text) {
    const li = document.createElement('li');
    li.appendChild(link(href, text));
    return li;
  }

  function loadOverview(fullVersion) {
    if (overviewCache.has(fullVersion)) {
      return Promise.resolve(overviewCache.get(fullVersion));
    }
    return fetchJSON(baseUrlFor(fullVersion) + '.overview.json').then((data) => {
      overviewCache.set(fullVersion, data);
      return data;
    });
  }

  function buildProfileIndex(overview) {
    return (overview.profiles || []).map((p) => {
      const titles = p.titles || [];
      return {
        id: p.id,
        target: p.target,
        vendor: titles[0]?.vendor || '',
        model: titles[0]?.model || '',
        searchHay: titles
          .map((t) => (t.vendor || '') + ' ' + (t.model || ''))
          .join(' ')
          .toLowerCase(),
      };
    });
  }

  // ---- render --------------------------------------------------------------

  function renderResults() {
    const q = searchEl.value.trim().toLowerCase();
    const isSnapshot = versionEl.value === 'snapshot';
    const fullVersion = selectedFullVersion();

    resultsEl.replaceChildren();
    if (isSnapshot) resultsEl.appendChild(snapshotWarning());

    if (!q) {
      if (isSnapshot) resultsEl.appendChild(snapshotCard());
      else resultsEl.appendChild(stableCard(fullVersion, seriesOf(fullVersion)));
      resultsEl.appendChild(searchHint());
      return;
    }

    const matches = currentProfileIndex.filter((p) => p.searchHay.includes(q));

    if (matches.length === 0) {
      resultsEl.appendChild(emptyResults(q, fullVersion));
      return;
    }

    const meta = el('p', 'dl-results-meta');
    if (matches.length > RESULT_CAP) {
      meta.textContent = `${matches.length.toLocaleString()} matches — showing first ${RESULT_CAP}. Refine your search to narrow down.`;
    } else {
      meta.textContent = `${matches.length.toLocaleString()} ${matches.length === 1 ? 'match' : 'matches'}`;
    }
    resultsEl.appendChild(meta);

    const ul = el('ul', 'dl-results-list');
    for (const p of matches.slice(0, RESULT_CAP)) ul.appendChild(deviceRow(p, fullVersion));
    resultsEl.appendChild(ul);
  }

  function deviceRow(profileMeta, fullVersion) {
    const li = el('li', 'dl-row');

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'dl-row-head';
    head.setAttribute('aria-expanded', 'false');
    head.appendChild(el('span', 'dl-row-brand', profileMeta.vendor));
    head.appendChild(el('span', 'dl-row-model', profileMeta.model));
    const chev = el('span', 'dl-row-chev', '▸');
    head.appendChild(chev);
    li.appendChild(head);

    const detail = el('div', 'dl-row-detail');
    detail.hidden = true;

    head.addEventListener('click', () => {
      if (detail.hidden) {
        if (!detail.dataset.built) {
          buildDetail(detail, profileMeta, fullVersion);
          detail.dataset.built = '1';
        }
        detail.hidden = false;
        head.setAttribute('aria-expanded', 'true');
        chev.textContent = '▾';
      } else {
        detail.hidden = true;
        head.setAttribute('aria-expanded', 'false');
        chev.textContent = '▸';
      }
    });

    li.appendChild(detail);
    return li;
  }

  function buildDetail(detail, profileMeta, fullVersion) {
    detail.appendChild(el('p', 'dl-empty', 'Loading device info…'));

    Promise.all([
      loadDevice(profileMeta.id),
      loadProfiles(fullVersion, profileMeta.target).catch(() => null),
    ]).then(([deviceData, profilesData]) => {
      const profile = profilesData?.profiles?.[profileMeta.id] || null;
      renderDetail(detail, deviceData, profile, fullVersion, profileMeta);
    });
  }

  function renderDetail(detail, deviceData, profile, fullVersion, profileMeta) {
    detail.replaceChildren();

    if (deviceData) detail.appendChild(renderSpecs(deviceData));

    const actions = el('p', 'dl-actions');
    if (profile && Array.isArray(profile.images) && profile.images.length) {
      const baseUrl = baseUrlFor(fullVersion) + 'targets/' + profileMeta.target + '/';
      const installImg = pickImage(profile.images, [
        'factory',
        'combined-factory',
        'sdcard',
        'sysupgrade-factory',
      ]);
      const upgradeImg = pickImage(profile.images, ['sysupgrade']);
      if (installImg) actions.appendChild(btn(baseUrl + installImg.name, 'Install image', 'btn-primary'));
      if (upgradeImg) actions.appendChild(btn(baseUrl + upgradeImg.name, 'Sysupgrade image'));
    }

    const wikiUrl = wikiPageUrl(deviceData && deviceData.devicepage);
    if (wikiUrl) actions.appendChild(btn(wikiUrl, 'Wiki page'));

    if (actions.childNodes.length) detail.appendChild(actions);
    else detail.appendChild(el('p', 'dl-empty', 'No images published for this device.'));

    if (deviceData) {
      const note = noteForDevice(deviceData);
      if (note) detail.appendChild(note);
    }
  }

  // ---- per-device + per-target loaders -------------------------------------

  // /toh/devices/{safe-id}.json — split-toh.sh sanitises identically.
  function loadDevice(profileId) {
    if (deviceCache.has(profileId)) return deviceCache.get(profileId);
    const safe = profileId.replace(/[^A-Za-z0-9._-]/g, '_');
    const url = TOH_DEVICE_BASE + encodeURIComponent(safe) + '.json';
    const p = fetchJSON(url).catch(() => null); // missing toh data is non-fatal
    deviceCache.set(profileId, p);
    return p;
  }

  // /releases/{ver}/targets/{target}/profiles.json (or
  // /snapshots/targets/{target}/profiles.json for snapshot) —
  // authoritative URLs.
  function loadProfiles(fullVersion, targetPath) {
    const key = fullVersion + '|' + targetPath;
    if (profilesCache.has(key)) return profilesCache.get(key);
    const p = fetchJSON(
      baseUrlFor(fullVersion) + 'targets/' + targetPath + '/profiles.json'
    ).catch((err) => {
      profilesCache.delete(key); // don't cache failures
      throw err;
    });
    profilesCache.set(key, p);
    return p;
  }

  // ---- spec rendering (operates on a flat per-device toh object) ----------

  function renderSpecs(d) {
    const dl = el('dl', 'dl-specs');
    addSpec(dl, 'Target',          targetCellOf(d));
    addSpec(dl, 'CPU',             strOf(d.cpu));
    addSpec(dl, 'Memory/Storage',  memoryCellOf(d));
    addSpec(dl, 'Wi-Fi',           wifiTextOf(d));
    addSpec(dl, 'Ethernet',        ethernetCellOf(d));
    addSpec(dl, 'USB',             usbCellOf(d));
    addSpec(dl, 'Supported since', strOf(d.supportedsincerel));
    addSpec(dl, 'Current release', strOf(d.supportedcurrentrel));
    return dl;
  }

  function targetCellOf(d) {
    const t = strOf(d.target);
    const s = strOf(d.subtarget);
    if (!t) return '';
    return s ? t + '/' + s : t;
  }

  function memoryCellOf(d) {
    const f = num(d.flashmb);
    const r = num(d.rammb);
    if (!f && !r) return '';
    return (f || '?') + ' MB flash / ' + (r || '?') + ' MB RAM';
  }

  function ethernetCellOf(d) {
    const parts = [];
    const ports = (k, label) => {
      const c = num(d[k]);
      if (c >= 1) parts.push(c + '× ' + label);
    };
    ports('ethernet10gports', '10G');
    ports('ethernet5gports', '5G');
    ports('ethernet2_5gports', '2.5G');
    ports('ethernet1gports', '1G');
    ports('ethernet100mports', '100M');
    return parts.join(', ');
  }

  function usbCellOf(d) {
    const v = d.usbports;
    if (!v) return '';
    const arr = Array.isArray(v) ? v : [v];
    return arr.filter((s) => s && s !== '-' && !/^\s*$/.test(String(s))).join(', ');
  }

  function wikiPageUrl(p) {
    if (!p || p === '-') return null;
    return WIKI_BASE + String(p).replace(/:/g, '/');
  }

  function wifiTextOf(d) {
    const std = highestWifiStdOf(d);
    if (!std) return '';
    const gen = { BE: 7, AX: 6, AC: 5, N: 4, G: 3, A: 2, B: 1 }[std];
    const b24 = strOf(d.wlan24ghz);
    const b50 = strOf(d.wlan50ghz);
    const b60 = strOf(d.wlan60ghz);
    const has24 = b24 && b24 !== '-';
    const has50 = b50 && b50 !== '-';
    const has60 = b60 && b60 !== '-';
    let band = '';
    if (has60 && (has50 || has24)) band = 'tri-band';
    else if (has50 && has24) band = 'dual-band';
    else if (has50) band = '5 GHz';
    else if (has24) band = '2.4 GHz';
    else if (has60) band = '60 GHz';
    return 'Wi-Fi ' + gen + (band ? ' · ' + band : '');
  }

  function highestWifiStdOf(d) {
    const all = (
      strOf(d.wlan24ghz) + ' ' + strOf(d.wlan50ghz) + ' ' + strOf(d.wlan60ghz)
    ).toLowerCase();
    if (/(^|[/, ])be([/, ]|$)/.test(all)) return 'BE';
    if (/(^|[/, ])ax([/, ]|$)/.test(all)) return 'AX';
    if (/(^|[/, ])ac([/, ]|$)/.test(all)) return 'AC';
    if (/(^|[/, ])n([/, ]|$)/.test(all))  return 'N';
    if (/(^|[/, ])g([/, ]|$)/.test(all))  return 'G';
    if (/(^|[/, ])a([/, ]|$)/.test(all))  return 'A';
    if (/(^|[/, ])b([/, ]|$)/.test(all))  return 'B';
    return '';
  }

  function noteForDevice(d) {
    const flash = num(d.flashmb);
    const ram = num(d.rammb);
    if ((flash > 0 && flash <= 8) || (ram > 0 && ram <= 64)) {
      const div = el('div', 'dl-warn');
      div.append(
        '⚠ Only ' + (flash || '?') + ' MB flash / ' + (ram || '?') +
          ' MB RAM. Modern OpenWrt may not run comfortably and updates may stop. Avoid for new installs.'
      );
      return div;
    }
    return null;
  }

  // ---- cards / banners / hints --------------------------------------------

  function stableCard(fullVersion, series) {
    const card = el('div', 'dl-card');
    card.appendChild(el('h2', null, 'OpenWrt ' + fullVersion));
    const sub = el('p', 'dl-card-sub');
    sub.textContent =
      series === seriesOf(stable)
        ? 'Latest stable release. Pick your device above for direct image downloads, or browse the file server for raw images.'
        : 'Selected release. Pick your device above for direct image downloads.';
    card.appendChild(sub);

    const actions = el('p', 'dl-actions');
    actions.appendChild(btn(RELEASE_BASE + fullVersion + '/', 'Browse release files', 'btn-primary'));
    actions.appendChild(btn(NOTES_BASE + series + '/notes-' + fullVersion, 'Release notes'));
    card.appendChild(actions);
    return card;
  }

  function snapshotCard() {
    const card = el('div', 'dl-card dl-card-warn');
    card.appendChild(el('h2', null, 'Snapshot builds'));
    const sub = el('p', 'dl-card-sub');
    sub.textContent =
      'Automatic builds of the development branch. They can break, are not security-supported, and may not upgrade cleanly. For everyday use pick a stable release above.';
    card.appendChild(sub);
    const actions = el('p', 'dl-actions');
    actions.appendChild(btn(SNAPSHOTS_URL, 'Browse snapshot files', 'btn-primary'));
    card.appendChild(actions);
    return card;
  }

  function snapshotWarning() {
    const div = el('div', 'dl-snapshot-warn');
    div.append(
      '⚠ Snapshot builds are unstable, unsigned, and not security-supported. ',
      el('strong', null, 'Developers only.'),
      ' For production devices, switch to a stable release above.'
    );
    return div;
  }

  function searchHint() {
    const p = el('p', 'dl-empty');
    p.append(
      'Start typing your device above to see download links, or ',
      link('/toh/', 'browse the full Table of Hardware'),
      ' to filter by capabilities.'
    );
    return p;
  }

  function emptyResults(q, fullVersion) {
    const wrap = el('div');
    const p = el('p', 'dl-empty');
    p.append(
      'No devices in OpenWrt ' + fullVersion + ' match ',
      el('strong', null, '"' + q + '"'),
      '. Pick a different release above, or '
    );
    p.appendChild(link('/toh/', 'browse the full Table of Hardware'));
    p.append('.');
    wrap.appendChild(p);
    return wrap;
  }

  // ---- generic helpers -----------------------------------------------------

  function fetchJSON(url) {
    return fetch(url).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.json();
    });
  }

  function pickImage(images, types) {
    for (const t of types) {
      const img = images.find((i) => i && i.type === t);
      if (img) return img;
    }
    return null;
  }

  function num(v) {
    if (Array.isArray(v)) v = v[0];
    const n = parseInt(String(v ?? ''), 10);
    return isNaN(n) ? 0 : n;
  }

  function strOf(v) {
    if (v == null) return '';
    if (Array.isArray(v)) return v.filter(Boolean).join(' ');
    return String(v);
  }

  function seriesOf(v) {
    const m = String(v || '').match(/^(\d+\.\d+)/);
    return m ? m[1] : '';
  }

  function el(tag, cls, txt) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function link(href, text) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    return a;
  }

  function btn(href, text, cls) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    a.className = 'btn' + (cls ? ' ' + cls : '');
    return a;
  }

  function addSpec(dl, key, value) {
    if (!value) return;
    const dt = el('dt', null, key);
    const dd = el('dd', null, value);
    dl.appendChild(dt);
    dl.appendChild(dd);
  }
})();
