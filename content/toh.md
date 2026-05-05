---
title: "Supported devices"
description: "Search the OpenWrt Table of Hardware to check whether your device is supported and which images to use."
extra_scripts: ["js/toh.js"]
---

The Table of Hardware lists every router, access point, and embedded device known to work with OpenWrt. Click a model name to open its full device page on the wiki, or use the install/upgrade links on the right to grab firmware images directly. Data is loaded live from <https://openwrt.org/toh.json>.

<div id="toh-app" class="toh-app">
  <div class="toh-controls">
    <input id="toh-search" type="search" placeholder="Search brand or model…" autocomplete="off">
    <span id="toh-quick" class="toh-quick"></span>
    <span id="toh-count" class="toh-count">Loading…</span>
  </div>

  <details class="toh-filters">
    <summary>Filters</summary>
    <div id="toh-filters-grid" class="toh-filter-grid"></div>
  </details>

  <p class="toh-filter-actions">
    <label class="toh-toggle"><input type="checkbox" id="toh-show-tech"> Advanced view</label>
    <button id="toh-clear" type="button">Clear all filters</button>
  </p>

  <p id="toh-status-msg" class="toh-status" role="status"></p>
  <p class="toh-notice"><strong>Do not buy devices with 8 MB flash / 64 MB RAM</strong> — they cannot run modern OpenWrt comfortably and stop receiving updates. Such devices are hidden by default; uncheck <em>Hide unrecommended</em> above to see them (highlighted in red).</p>
  <div class="toh-table-wrap">
    <table class="toh-table">
      <thead>
        <tr>
          <th data-sort="brand">Device</th>
          <th>Wi-Fi</th>
          <th>Memory/Storage</th>
          <th>Firmware</th>
          <th class="toh-tech" data-sort="target">Target</th>
          <th class="toh-tech" data-sort="supportedsincerel">Since</th>
          <th class="toh-tech" data-sort="supportedcurrentrel">Current</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>
