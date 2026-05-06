// Lightweight Table of Hardware viewer.
// Loads the live OpenWrt device list from https://openwrt.org/toh.json and
// renders a searchable, filterable, sortable table. Same-origin in
// production; cross-origin requests are blocked by CORS.
(function () {
  const root = document.getElementById('toh-app');
  if (!root) return;

  const $ = (sel) => root.querySelector(sel);
  const RENDER_CAP = 500;
  const LIVE_URL = 'https://openwrt.org/toh.json';
  // Build-time snapshot of toh.json bundled into the site (see deploy.yml).
  // Same-origin and reliable; falls back to live if missing/stale.
  const LOCAL_URL = new URL('data.json', document.baseURI).href;

  // Filter definitions, organised by visibility tier.
  // Each filter: [id, label, sub-text (or ''), test(entry, idx) -> bool].
  // Quick filters skip sub-text (rendered as compact inline toggles).
  // QUICK: [id, label, test, defaultChecked]
  const QUICK = [
    ['hide-low-mem', 'Hide unrecommended',
      (e, x) => !isLowMem(e, x), true],
    ['wax', 'Wi-Fi 6',
      (e, x) => hasTok(e[x.wlan50ghz], 'ax') || hasTok(e[x.wlan24ghz], 'ax'), true],
    ['eth1g', '≥ 1G Ethernet',
      (e, x) =>
        num(e[x.ethernet1gports]) >= 1 ||
        num(e[x.ethernet2_5gports]) >= 1 ||
        num(e[x.ethernet10gports]) >= 1,
      true],
  ];

  function isLowMem(e, x) {
    const f = num(e[x.flashmb]);
    const r = num(e[x.rammb]);
    return (f > 0 && f <= 8) || (r > 0 && r <= 64);
  }

  const FILTER_GROUPS = [
    { name: 'Network', filters: [
      ['eth25g', 'Ethernet 2.5G', '≥ 1× 2.5G',     (e, x) => num(e[x.ethernet2_5gports]) >= 1],
      ['eth10g', 'Ethernet 10G',  '≥ 1× 10G',      (e, x) => num(e[x.ethernet10gports])  >= 1],
      ['sfp',    'SFP',           'SFP port',      (e, x) => num(e[x.sfp_ports]) + num(e[x.sfp_plus_ports]) >= 1],
      ['vlan',   'VLAN',          'supports VLAN', (e, x) => hasFeature(e[x.vlan])],
    ]},
    { name: 'Wi-Fi', filters: [
      ['wac', 'Wi-Fi AC', '802.11ac',   (e, x) => hasTok(e[x.wlan50ghz], 'ac')],
      ['wbe', 'Wi-Fi BE', '802.11be',   (e, x) => hasTok(e[x.wlan60ghz], 'be') || hasTok(e[x.wlan50ghz], 'be')],
      ['ant', 'Antennas', 'detachable', (e, x) => num(e[x.detachableantennas]) >= 1],
      ['wn',  'Wi-Fi N',  '802.11n',    (e, x) => hasTok(e[x.wlan24ghz], 'n') || hasTok(e[x.wlan50ghz], 'n')],
      ['wg',  'Wi-Fi G',  '802.11g',    (e, x) => hasTok(e[x.wlan24ghz], 'g')],
      ['wb',  'Wi-Fi B',  '802.11b',    (e, x) => hasTok(e[x.wlan24ghz], 'b')],
    ]},
    { name: 'Memory/Storage', filters: [
      ['mem-mini', 'Mini',    '≥ 16 / 64 MB',   (e, x) => num(e[x.flashmb]) >= 16  && num(e[x.rammb]) >= 64],
      ['mem-more', 'More',    '≥ 64 / 128 MB',  (e, x) => num(e[x.flashmb]) >= 64  && num(e[x.rammb]) >= 128],
      ['mem-comf', 'Comfort', '≥ 128 / 128 MB', (e, x) => num(e[x.flashmb]) >= 128 && num(e[x.rammb]) >= 128],
    ]},
    { name: 'Ports', filters: [
      ['p-usb',   'USB',   'USB port',   (e, x) => hasUsb(e[x.usbports])],
      ['p-gpio',  'GPIOs', 'with GPIOs', (e, x) => num(e[x.gpios])      >= 1],
      ['p-audio', 'Audio', 'audio port', (e, x) => num(e[x.audioports]) >= 1],
      ['p-sata',  'SATA',  'SATA port',  (e, x) => num(e[x.sataports])  >= 1],
      ['p-phone', 'Phone', 'phone port', (e, x) => num(e[x.phoneports]) >= 1],
      ['p-video', 'Video', 'video port', (e, x) => num(e[x.videoports]) >= 1],
    ]},
    { name: 'Power', filters: [
      ['pw-poe', 'PoE',     'PoE capable',     (e, x) => /poe/i.test(power(e, x))],
      ['pw-bat', 'Battery', 'battery powered', (e, x) => /battery/i.test(power(e, x))],
      ['pw-usb', 'USB',     'USB powered',     (e, x) => /usb/i.test(power(e, x))],
    ]},
    { name: 'Connectivity', filters: [
      ['f-mc', 'Modem cell', 'cellular modem', (e, x) => /cell|gsm|lte|3g|4g|5g/i.test(strOf(e[x.modem]))],
      ['f-md', 'Modem DSL',  'DSL modem',      (e, x) => /dsl|adsl|vdsl/i.test(strOf(e[x.modem]))],
    ]},
    { name: 'Features', filters: [
      ['f-bt',  'Bluetooth', 'with Bluetooth', (e, x) => hasFeature(e[x.bluetooth])],
      ['f-out', 'Outdoor',   'outdoor usage',  (e, x) => hasFeature(e[x.outdoor])],
    ]},
    { name: 'Type', filters: [
      ['t-router', 'Wi-Fi Router', 'wireless router', (e, x) => /wifi router|wireless router/i.test(strOf(e[x.devicetype]))],
      ['t-ap',     'Wi-Fi AP',     'access point',    (e, x) => /\bAP\b|access point/i.test(strOf(e[x.devicetype]))],
      ['t-board',  'Board',        'single-board',    (e, x) => /board|sbc/i.test(strOf(e[x.devicetype]))],
      ['t-travel', 'Travel',       'travel router',   (e, x) => /travel/i.test(strOf(e[x.devicetype]))],
      ['t-switch', 'Switch',       'switch',          (e, x) => /switch/i.test(strOf(e[x.devicetype]))],
      ['t-modem',  'Modem',        'with modem',      (e, x) => /modem/i.test(strOf(e[x.devicetype]))],
    ]},
  ];

  const search = $('#toh-search');
  const countEl = $('#toh-count');
  const tbody = $('tbody');
  const tableEl = $('.toh-table');
  const statusEl = $('#toh-status-msg');
  const quickEl = $('#toh-quick');
  const filterPanel = $('#toh-filters-grid');

  let columns, idx, entries;
  let sortKey = 'brand';
  let sortDir = 1;
  let releaseFilter = null; // e.g. "25.12.2" — set from ?release=
  let seriesFilter = null;  // e.g. "25.12" — derived from releaseFilter

  buildQuick();
  buildGroups(filterPanel, FILTER_GROUPS);

  fetchToh()
    .then(init)
    .catch((err) => {
      countEl.textContent = '';
      statusEl.textContent =
        'Could not load device data (' + err.message + ').';
    });

  // Try the build-time snapshot first (same-origin, reliable). Fall back to
  // live openwrt.org/toh.json if the snapshot is missing or invalid.
  function fetchToh() {
    const tryFetch = (url) =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(url + ' HTTP ' + r.status);
        return r.json();
      });
    return tryFetch(LOCAL_URL).catch(() => tryFetch(LIVE_URL));
  }

  function init(data) {
    columns = data.columns;
    entries = data.entries;
    idx = {};
    columns.forEach((k, i) => (idx[k] = i));

    // Honour ?release=X.Y.Z in the URL — pre-filters to devices supported in
    // that series. Reachable from the Downloads page's "Find your device" CTA.
    const params = new URLSearchParams(location.search);
    const rel = params.get('release');
    if (rel) {
      releaseFilter = rel;
      const m = rel.match(/^(\d+\.\d+)/);
      seriesFilter = m ? m[1] : null;
      if (seriesFilter) showReleaseBanner(rel);
    }

    statusEl.textContent = '';
    render();

    search.addEventListener('input', render);
    root.querySelectorAll('th[data-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const k = th.dataset.sort;
        if (sortKey === k) sortDir = -sortDir;
        else {
          sortKey = k;
          sortDir = 1;
        }
        updateSortIndicators();
        render();
      });
    });
    updateSortIndicators();

    const clearBtn = $('#toh-clear');
    if (clearBtn) clearBtn.addEventListener('click', clearAll);

    const techToggle = $('#toh-show-tech');
    if (techToggle) {
      techToggle.addEventListener('change', () => {
        tableEl.classList.toggle('show-tech', techToggle.checked);
        render();
      });
    }
  }

  function buildQuick() {
    if (!quickEl) return;
    for (const [id, label, test, defaultChecked] of QUICK) {
      const lab = document.createElement('label');
      lab.className = 'toh-quick-item';
      lab.htmlFor = 'f-' + id;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = 'f-' + id;
      cb._test = test;
      if (defaultChecked) cb.checked = true;
      cb.addEventListener('change', render);
      const text = document.createElement('span');
      text.textContent = label;
      lab.appendChild(cb);
      lab.appendChild(text);
      quickEl.appendChild(lab);
    }
  }

  function buildGroups(container, groups) {
    if (!container) return;
    for (const group of groups) {
      const fs = document.createElement('fieldset');
      const lg = document.createElement('legend');
      lg.textContent = group.name;
      fs.appendChild(lg);
      for (const [id, label, sub, test] of group.filters) {
        const lab = document.createElement('label');
        lab.htmlFor = 'f-' + id;
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = 'f-' + id;
        cb._test = test;
        cb.addEventListener('change', render);
        const main = document.createElement('span');
        main.className = 'toh-f-label';
        main.textContent = label;
        lab.appendChild(cb);
        lab.appendChild(main);
        if (sub) {
          const s = document.createElement('span');
          s.className = 'toh-f-sub';
          s.textContent = sub;
          lab.appendChild(s);
        }
        fs.appendChild(lab);
      }
      container.appendChild(fs);
    }
  }

  function collectChecks() {
    const out = [];
    root.querySelectorAll('input[type=checkbox]').forEach((cb) => {
      if (cb.checked && cb._test) out.push(cb._test);
    });
    return out;
  }

  function clearAll() {
    root
      .querySelectorAll('input[type=checkbox]')
      .forEach((cb) => {
        if (cb.id !== 'toh-show-tech') cb.checked = false;
      });
    search.value = '';
    clearReleaseFilter();
    render();
  }

  function clearReleaseFilter() {
    if (!releaseFilter) return;
    releaseFilter = null;
    seriesFilter = null;
    history.replaceState(null, '', location.pathname);
    const banner = root.querySelector('.toh-release-filter');
    if (banner) banner.remove();
  }

  function showReleaseBanner(release) {
    const banner = document.createElement('div');
    banner.className = 'toh-release-filter';
    banner.append('Showing devices supported in OpenWrt ');
    const strong = document.createElement('strong');
    strong.textContent = release;
    banner.appendChild(strong);
    banner.append('. ');
    const a = document.createElement('a');
    a.href = location.pathname;
    a.textContent = 'Show all devices';
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      clearReleaseFilter();
      render();
    });
    banner.appendChild(a);

    const controls = root.querySelector('.toh-controls');
    if (controls) controls.parentNode.insertBefore(banner, controls);
    else root.prepend(banner);
  }

  function updateSortIndicators() {
    root.querySelectorAll('th[data-sort]').forEach((th) => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.sort === sortKey) {
        th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  function render() {
    if (!entries) return;
    const q = search.value.trim().toLowerCase();
    const checks = collectChecks();

    let rows = entries.filter((e) => {
      for (const test of checks) {
        if (!test(e, idx)) return false;
      }
      if (q) {
        const hay = (e[idx.brand] || '') + ' ' + (e[idx.model] || '');
        if (!hay.toLowerCase().includes(q)) return false;
      }
      if (seriesFilter) {
        const cur = String(e[idx.supportedcurrentrel] ?? '');
        if (cur !== seriesFilter && !cur.startsWith(seriesFilter + '.')) return false;
      }
      return true;
    });

    rows = rows.sort((a, b) => {
      const av = String(a[idx[sortKey]] ?? '');
      const bv = String(b[idx[sortKey]] ?? '');
      return sortDir * av.localeCompare(bv, undefined, { numeric: true });
    });

    const visible = rows.slice(0, RENDER_CAP);
    const total = rows.length;
    countEl.textContent =
      total === 1 ? '1 device' : total.toLocaleString() + ' devices';
    if (total > RENDER_CAP) {
      countEl.textContent += ' (showing first ' + RENDER_CAP + ')';
    }

    const frag = document.createDocumentFragment();
    for (const e of visible) frag.appendChild(buildRow(e));
    tbody.replaceChildren(frag);
  }

  function buildRow(e) {
    const tr = document.createElement('tr');
    const flash = num(e[idx.flashmb]);
    const ram = num(e[idx.rammb]);
    const lowMem = isLowMem(e, idx);
    if (lowMem) tr.classList.add('toh-low-mem');

    const target = e[idx.target] || '';
    const subtarget = e[idx.subtarget] || '';
    const installArr = e[idx.firmwareopenwrtinstallurl];
    const upgradeArr = e[idx.firmwareopenwrtupgradeurl];

    // Combined Brand · Model cell. Both pieces truncate independently with
    // a `title` tooltip revealing the full text on hover.
    const dev = document.createElement('td');
    const brand = e[idx.brand] || '';
    const model = e[idx.model] || '';

    const brandEl = document.createElement('strong');
    brandEl.className = 'toh-brand';
    brandEl.textContent = brand;
    if (brand) brandEl.title = brand;
    dev.appendChild(brandEl);
    if (brand) dev.append(' ');

    const href = devUrl(e[idx.devicepage]);
    const modelEl = document.createElement(href ? 'a' : 'span');
    modelEl.className = 'toh-model';
    modelEl.textContent = model;
    if (model) modelEl.title = model;
    if (href) modelEl.href = href;
    dev.appendChild(modelEl);
    tr.appendChild(dev);

    // Wi-Fi cell — tag (Wi-Fi 6) by default, technical (AX · dual) when tech mode is on.
    const wifi = document.createElement('td');
    const tag = wifiCell(e);
    if (tag) wifi.appendChild(tag);
    tr.appendChild(wifi);

    // Memory/Storage cell — flagged if at or below the "do not buy" threshold.
    const mem = document.createElement('td');
    const memText = (flash || ram) ? (flash || '?') + ' / ' + (ram || '?') + ' MB' : '';
    if (memText) {
      const span = document.createElement('span');
      span.className = 'toh-mem' + (lowMem ? ' toh-mem-bad' : '');
      span.textContent = memText;
      const detail = (flash || '?') + ' MB flash / ' + (ram || '?') + ' MB RAM';
      span.title = lowMem ? detail + ' — not recommended' : detail;
      mem.appendChild(span);
    }
    tr.appendChild(mem);

    // Firmware column: an expand toggle that reveals firmware details below.
    const imgs = document.createElement('td');
    imgs.className = 'toh-imgs';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toh-expand';
    btn.textContent = '▸';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Show firmware downloads');
    imgs.appendChild(btn);
    tr.appendChild(imgs);

    tr.appendChild(td(target + (subtarget ? '/' + subtarget : ''), 'toh-tech'));
    tr.appendChild(td(e[idx.supportedsincerel] || '', 'toh-tech'));
    tr.appendChild(td(e[idx.supportedcurrentrel] || '', 'toh-tech'));

    // Detail row, hidden by default. Spans all columns (including tech ones).
    const detail = document.createElement('tr');
    detail.className = 'toh-detail';
    detail.hidden = true;
    const detailCell = document.createElement('td');
    detailCell.colSpan = 7;
    detailCell.appendChild(buildDetail(e));
    detail.appendChild(detailCell);

    btn.addEventListener('click', () => {
      const opening = detail.hidden;
      detail.hidden = !opening;
      btn.textContent = opening ? '▾' : '▸';
      btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
    });

    const frag = document.createDocumentFragment();
    frag.appendChild(tr);
    frag.appendChild(detail);
    return frag;
  }

  function buildDetail(e) {
    const wrap = document.createElement('div');
    wrap.className = 'toh-detail-inner';

    const advanced = !!($('#toh-show-tech') && $('#toh-show-tech').checked);
    const releaseInstall = first(e[idx.firmwareopenwrtinstallurl]);
    const releaseUpgrade = first(e[idx.firmwareopenwrtupgradeurl]);
    const snapInstall = advanced ? first(e[idx.firmwareopenwrtsnapshotinstallurl]) : null;
    const snapUpgrade = advanced ? first(e[idx.firmwareopenwrtsnapshotupgradeurl]) : null;
    const oemStock = first(e[idx.firmwareoemstockurl]);

    wrap.appendChild(detailSection(
      'First install',
      'Use this image when the device is still running the vendor firmware. Flash it through the manufacturer\'s stock update procedure (web UI, TFTP, recovery mode, etc.).',
      [
        releaseInstall && [releaseInstall, 'Release install image'],
        snapInstall    && [snapInstall,    'Snapshot install image'],
      ]
    ));

    wrap.appendChild(detailSection(
      'Sysupgrade',
      'Use this image to upgrade or reinstall an OpenWrt device that already runs OpenWrt. Apply via the LuCI flash page or the `sysupgrade` command — settings can be kept or wiped.',
      [
        releaseUpgrade && [releaseUpgrade, 'Release sysupgrade image'],
        snapUpgrade    && [snapUpgrade,    'Snapshot sysupgrade image'],
      ]
    ));

    if (oemStock) {
      wrap.appendChild(detailSection(
        'Vendor firmware',
        'Original manufacturer firmware — useful if you need to revert to stock.',
        [[oemStock, 'OEM stock firmware']]
      ));
    }

    return wrap;
  }

  function detailSection(title, desc, links) {
    const sec = document.createElement('div');
    sec.className = 'toh-detail-section';
    const h = document.createElement('h4');
    h.textContent = title;
    sec.appendChild(h);
    const p = document.createElement('p');
    p.textContent = desc;
    sec.appendChild(p);
    const ul = document.createElement('ul');
    let added = 0;
    for (const item of links) {
      if (!item) continue;
      const [href, label] = item;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.className = 'toh-btn';
      a.textContent = label;
      li.appendChild(a);
      ul.appendChild(li);
      added++;
    }
    if (added) sec.appendChild(ul);
    else {
      const na = document.createElement('p');
      na.className = 'toh-detail-na';
      na.textContent = 'No image available for this device.';
      sec.appendChild(na);
    }
    return sec;
  }

  function first(v) {
    if (Array.isArray(v) && v[0]) return v[0];
    return null;
  }

  // Generation tag (Wi-Fi 1–7) by default, technical descriptor when the
  // "Show technical columns" toggle is on. Returns a DOM node or null.
  function wifiCell(e) {
    const b24 = strOf(e[idx.wlan24ghz]);
    const b50 = strOf(e[idx.wlan50ghz]);
    const b60 = strOf(e[idx.wlan60ghz]);
    const all = (b24 + ' ' + b50 + ' ' + b60).toLowerCase();
    let std = '';
    if (/(^|[/, ])be([/, ]|$)/.test(all))      std = 'BE';
    else if (/(^|[/, ])ax([/, ]|$)/.test(all)) std = 'AX';
    else if (/(^|[/, ])ac([/, ]|$)/.test(all)) std = 'AC';
    else if (/(^|[/, ])n([/, ]|$)/.test(all))  std = 'N';
    else if (/(^|[/, ])g([/, ]|$)/.test(all))  std = 'G';
    else if (/(^|[/, ])a([/, ]|$)/.test(all))  std = 'A';
    else if (/(^|[/, ])b([/, ]|$)/.test(all))  std = 'B';
    if (!std) return null;

    const tech = $('#toh-show-tech') && $('#toh-show-tech').checked;
    const span = document.createElement('span');

    if (tech) {
      const has24 = b24 && b24 !== '-';
      const has50 = b50 && b50 !== '-';
      const has60 = b60 && b60 !== '-';
      let band = '';
      if (has60 && (has50 || has24)) band = 'tri';
      else if (has50 && has24) band = 'dual';
      else if (has50) band = '5 GHz';
      else if (has24) band = '2.4 GHz';
      else if (has60) band = '60 GHz';
      span.className = 'toh-wifi';
      span.textContent = std + (band ? ' · ' + band : '');
      return span;
    }

    const gen = { BE: 7, AX: 6, AC: 5, N: 4, G: 3, A: 2, B: 1 }[std];
    span.className = 'toh-wifi toh-wifi-' + gen;
    span.textContent = 'Wi-Fi ' + gen;
    span.title = '802.11' + std.toLowerCase();
    return span;
  }

  // ---- helpers --------------------------------------------------------

  function td(content, cls) {
    const el = document.createElement('td');
    if (cls) el.className = cls;
    if (content instanceof Node) el.appendChild(content);
    else el.textContent = content == null ? '' : String(content);
    return el;
  }

  function linkOrText(text, href) {
    if (!href) return document.createTextNode(text || '');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    return a;
  }

  function makeLink(href, text) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    return a;
  }

  function devUrl(p) {
    if (!p || p === '-') return null;
    return 'https://openwrt.org/' + String(p).replace(/:/g, '/');
  }

  function num(v) {
    if (Array.isArray(v)) v = v[0];
    const n = parseInt(String(v ?? ''), 10);
    return isNaN(n) ? 0 : n;
  }

  // True if the field carries any positive indication (a count, a version
  // string, "Yes", etc.) — false for null, "-", "None", "0", or "No".
  function hasFeature(v) {
    if (Array.isArray(v)) v = v[0];
    if (v == null) return false;
    const s = String(v).trim();
    if (!s || s === '-' || s === 'None' || s === '0') return false;
    if (/^no$/i.test(s)) return false;
    return true;
  }

  function strOf(v) {
    if (Array.isArray(v)) return v.join(' ');
    return String(v ?? '');
  }

  function hasTok(v, tok) {
    if (!v || v === '-') return false;
    return new RegExp('(^|[/, ])' + tok + '([/, ]|$)', 'i').test(strOf(v));
  }

  function hasUsb(v) {
    if (!v) return false;
    const arr = Array.isArray(v) ? v : [v];
    return arr.some((s) => s && s !== '-' && !/^\s*-?\s*$/.test(String(s)));
  }

  function power(e, x) {
    return strOf(e[x.powersupply]);
  }

})();
