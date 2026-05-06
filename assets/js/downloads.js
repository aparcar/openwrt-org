// Search-first downloads page.
// Loads the device list from https://openwrt.org/toh.json and the active
// release list from https://downloads.openwrt.org/.versions.json (both
// CORS-permissive). Empty search → latest-stable card; typing a brand or
// model → up to RESULT_CAP matches, click a row to expand specs and grab
// install / sysupgrade images.
(function () {
  const root = document.getElementById('downloads-app');
  if (!root) return;

  const LIVE_TOH_URL = 'https://openwrt.org/toh.json';
  // Build-time snapshot of toh.json (see deploy.yml). Same-origin and reliable;
  // falls back to live if the snapshot is missing.
  const LOCAL_TOH_URL = new URL('../toh/data.json', document.baseURI).href;
  const VERSIONS_URL = 'https://downloads.openwrt.org/.versions.json';
  const RELEASE_BASE = 'https://downloads.openwrt.org/releases/';
  const NOTES_BASE = 'https://openwrt.org/releases/';
  const WIKI_BASE = 'https://openwrt.org/';
  const SNAPSHOTS_URL = 'https://downloads.openwrt.org/snapshots/';
  const RESULT_CAP = 30;

  let columns, idx, entries;
  let stable = '', oldstable = '', upcoming = '';
  let searchEl, versionEl, resultsEl;

  Promise.all([fetchToh(), fetchJSON(VERSIONS_URL)])
    .then(([toh, versions]) => {
      columns = toh.columns;
      entries = toh.entries;
      idx = {};
      columns.forEach((k, i) => (idx[k] = i));
      stable = versions.stable_version || '';
      oldstable = versions.oldstable_version || '';
      upcoming = versions.upcoming_version || '';

      buildShell();
      renderResults();
    })
    .catch((err) => {
      root.replaceChildren();
      const p = el('p', 'dl-error');
      p.append(
        'Could not load device data (' + err.message + '). Browse ',
        link('https://downloads.openwrt.org/', 'downloads.openwrt.org'),
        ' directly.'
      );
      root.appendChild(p);
    });

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

    // Populate the dropdown with the currently-built series (stable + oldstable).
    // We filter by series, so "25.12.2" and "25.12.0-rc5" both contribute the
    // same series option.
    const seen = new Set();
    if (stable) addVersionOption(versionEl, stable, seriesOf(stable), 'stable', seen);
    if (oldstable) addVersionOption(versionEl, oldstable, seriesOf(oldstable), 'security maintenance', seen);
    if (upcoming) addVersionOption(versionEl, upcoming, seriesOf(upcoming), 'release candidate', seen);

    // Snapshot — bleeding-edge dev builds. Marked red.
    const snapOpt = document.createElement('option');
    snapOpt.value = 'snapshot';
    snapOpt.className = 'dl-snapshot-option';
    snapOpt.textContent = 'Snapshot — developers only';
    versionEl.appendChild(snapOpt);

    versionEl.addEventListener('change', renderResults);

    bar.appendChild(searchEl);
    bar.appendChild(versionEl);
    root.appendChild(bar);

    resultsEl = el('div');
    resultsEl.id = 'dl-results';
    root.appendChild(resultsEl);
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

  // ---- results render ------------------------------------------------------

  function renderResults() {
    const q = searchEl.value.trim().toLowerCase();
    const series = versionEl.value;
    const isSnapshot = series === 'snapshot';
    const fullVersion = versionEl.selectedOptions[0]?.dataset.fullVersion || series;

    versionEl.classList.toggle('dl-snapshot-active', isSnapshot);
    resultsEl.replaceChildren();

    if (isSnapshot) resultsEl.appendChild(snapshotWarning());

    if (!q) {
      resultsEl.appendChild(isSnapshot ? snapshotCard() : stableCard(fullVersion, series));
      resultsEl.appendChild(searchHint());
      return;
    }

    const matches = entries.filter((e) => {
      const hay = (e[idx.brand] || '') + ' ' + (e[idx.model] || '');
      if (!hay.toLowerCase().includes(q)) return false;
      if (isSnapshot) {
        return !!first(e[idx.firmwareopenwrtsnapshotinstallurl]);
      }
      const cur = String(e[idx.supportedcurrentrel] ?? '');
      if (series && cur !== series && !cur.startsWith(series + '.')) return false;
      return true;
    });

    if (matches.length === 0) {
      resultsEl.appendChild(emptyResults(q, isSnapshot ? 'snapshot builds' : fullVersion));
      return;
    }

    const meta = el('p', 'dl-results-meta');
    if (matches.length > RESULT_CAP) {
      meta.textContent = `${matches.length.toLocaleString()} matches — showing first ${RESULT_CAP}. Refine your search to narrow down.`;
    } else {
      meta.textContent =
        `${matches.length.toLocaleString()} ${matches.length === 1 ? 'match' : 'matches'}`;
    }
    resultsEl.appendChild(meta);

    const ul = el('ul', 'dl-results-list');
    for (const e of matches.slice(0, RESULT_CAP)) ul.appendChild(deviceRow(e));
    resultsEl.appendChild(ul);
  }

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

  function searchHint() {
    const p = el('p', 'dl-empty');
    p.append(
      'Start typing your device above to see download links, or ',
      link('/toh/', 'browse the full Table of Hardware'),
      ' to filter by capabilities.'
    );
    return p;
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

  // ---- per-device row ------------------------------------------------------

  function deviceRow(e) {
    const li = el('li', 'dl-row');

    const head = document.createElement('button');
    head.type = 'button';
    head.className = 'dl-row-head';
    head.setAttribute('aria-expanded', 'false');

    const brand = el('span', 'dl-row-brand', e[idx.brand] || '');
    head.appendChild(brand);
    const model = el('span', 'dl-row-model', e[idx.model] || '');
    head.appendChild(model);
    const wifi = wifiTag(e);
    if (wifi) head.appendChild(wifi);
    const chev = el('span', 'dl-row-chev', '▸');
    head.appendChild(chev);
    li.appendChild(head);

    const detail = el('div', 'dl-row-detail');
    detail.hidden = true;

    head.addEventListener(
      'click',
      () => {
        if (detail.hidden) {
          if (!detail.dataset.built) {
            detail.appendChild(buildDetail(e));
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
      },
      false
    );

    li.appendChild(detail);
    return li;
  }

  function buildDetail(e) {
    const wrap = el('div');

    const specs = el('dl', 'dl-specs');
    addSpec(specs, 'Target',          targetCell(e));
    addSpec(specs, 'CPU',             strOf(e[idx.cpu]));
    addSpec(specs, 'Memory/Storage',  memoryCell(e));
    addSpec(specs, 'Wi-Fi',           wifiText(e));
    addSpec(specs, 'Ethernet',        ethernetCell(e));
    addSpec(specs, 'USB',             usbCell(e));
    addSpec(specs, 'Supported since', strOf(e[idx.supportedsincerel]));
    addSpec(specs, 'Current release', strOf(e[idx.supportedcurrentrel]));
    wrap.appendChild(specs);

    const isSnapshot = versionEl.value === 'snapshot';
    const actions = el('p', 'dl-actions');
    const installUrl = first(
      isSnapshot
        ? e[idx.firmwareopenwrtsnapshotinstallurl]
        : e[idx.firmwareopenwrtinstallurl]
    );
    const upgradeUrl = first(
      isSnapshot
        ? e[idx.firmwareopenwrtsnapshotupgradeurl]
        : e[idx.firmwareopenwrtupgradeurl]
    );
    const installLabel = isSnapshot ? 'Snapshot install image' : 'Install image';
    const upgradeLabel = isSnapshot ? 'Snapshot sysupgrade image' : 'Sysupgrade image';
    if (installUrl) actions.appendChild(btn(installUrl, installLabel, 'btn-primary'));
    if (upgradeUrl) actions.appendChild(btn(upgradeUrl, upgradeLabel));
    const wikiUrl = wikiPageUrl(e[idx.devicepage]);
    if (wikiUrl) actions.appendChild(btn(wikiUrl, 'Wiki page'));
    if (!actions.childNodes.length) {
      const p = el('p', 'dl-empty');
      p.textContent = 'No images published for this device.';
      wrap.appendChild(p);
    } else {
      wrap.appendChild(actions);
    }

    const note = noteForDevice(e);
    if (note) wrap.appendChild(note);

    return wrap;
  }

  function noteForDevice(e) {
    const flash = num(e[idx.flashmb]);
    const ram = num(e[idx.rammb]);
    if ((flash > 0 && flash <= 8) || (ram > 0 && ram <= 64)) {
      const div = el('div', 'dl-warn');
      div.append(
        '⚠ This device has only ' + (flash || '?') + ' MB flash and ' + (ram || '?') +
          ' MB RAM. Modern OpenWrt may not run comfortably and updates may stop. Avoid for new installs.'
      );
      return div;
    }
    return null;
  }

  // ---- spec helpers --------------------------------------------------------

  function addSpec(dl, key, value) {
    if (!value) return;
    const dt = el('dt', null, key);
    const dd = el('dd', null, value);
    dl.appendChild(dt);
    dl.appendChild(dd);
  }

  function targetCell(e) {
    const t = strOf(e[idx.target]);
    const s = strOf(e[idx.subtarget]);
    if (!t) return '';
    return s ? t + '/' + s : t;
  }

  function memoryCell(e) {
    const f = num(e[idx.flashmb]);
    const r = num(e[idx.rammb]);
    if (!f && !r) return '';
    return (f || '?') + ' MB flash / ' + (r || '?') + ' MB RAM';
  }

  function ethernetCell(e) {
    const parts = [];
    const ports = (n, label) => {
      const c = num(e[idx[n]]);
      if (c >= 1) parts.push(c + '× ' + label);
    };
    ports('ethernet10gports', '10G');
    ports('ethernet5gports', '5G');
    ports('ethernet2_5gports', '2.5G');
    ports('ethernet1gports', '1G');
    ports('ethernet100mports', '100M');
    return parts.join(', ');
  }

  function usbCell(e) {
    const v = e[idx.usbports];
    if (!v) return '';
    const arr = Array.isArray(v) ? v : [v];
    const filtered = arr.filter((s) => s && s !== '-' && !/^\s*$/.test(String(s)));
    return filtered.join(', ');
  }

  function wikiPageUrl(p) {
    if (!p || p === '-') return null;
    return WIKI_BASE + String(p).replace(/:/g, '/');
  }

  function wifiTag(e) {
    const std = highestWifiStd(e);
    if (!std) return null;
    const gen = { BE: 7, AX: 6, AC: 5, N: 4, G: 3, A: 2, B: 1 }[std];
    const span = el('span', 'toh-wifi toh-wifi-' + gen, 'Wi-Fi ' + gen);
    span.title = '802.11' + std.toLowerCase();
    return span;
  }

  function wifiText(e) {
    const std = highestWifiStd(e);
    if (!std) return '';
    const gen = { BE: 7, AX: 6, AC: 5, N: 4, G: 3, A: 2, B: 1 }[std];
    const b24 = strOf(e[idx.wlan24ghz]);
    const b50 = strOf(e[idx.wlan50ghz]);
    const b60 = strOf(e[idx.wlan60ghz]);
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

  function highestWifiStd(e) {
    const all = (
      strOf(e[idx.wlan24ghz]) +
      ' ' +
      strOf(e[idx.wlan50ghz]) +
      ' ' +
      strOf(e[idx.wlan60ghz])
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

  // ---- generic helpers -----------------------------------------------------

  function fetchJSON(url) {
    return fetch(url).then((r) => {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' for ' + url);
      return r.json();
    });
  }

  // Try the build-time snapshot first (same-origin, reliable). Fall back to
  // live openwrt.org/toh.json if the snapshot is missing or invalid.
  function fetchToh() {
    return fetchJSON(LOCAL_TOH_URL).catch(() => fetchJSON(LIVE_TOH_URL));
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

  function first(v) {
    if (Array.isArray(v) && v[0]) return v[0];
    return null;
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
})();
