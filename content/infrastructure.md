---
title: "Infrastructure"
description: "Servers, services, and people that keep OpenWrt running."
---

The OpenWrt project relies on volunteer developers, documentation teams, forum moderators, and active users. The team maintains a number of physical and virtual servers supporting the project's operations.

## Services

### Internally-managed

- **Website and documentation** — DokuWiki-based primary site and documentation, hosted on DigitalOcean. Admins: bobafetthotmail, jow, thess, zorun.
- **Forum** — Discourse-powered community discussion platform on DigitalOcean. Admins: hauke, jow, thess, psherman.
- **Git server** — Gitweb repositories at [git.openwrt.org](https://git.openwrt.org/) on DigitalOcean. Admins: jow, thess.
- **Email** — Exim/Dovecot handling the @openwrt.org domain and forum mail, on DigitalOcean.
- **Buildbot master** — Coordinates builders on Hetzner. Admins: jow, ynezz.
- **Downloads** — Current and released images on Hetzner, with usage statistics.
- **Downloads archive** — Legacy images and releases in private co-lo. Admin: wigyori.
- **Old wiki archive** — Historical wiki content in private co-lo.
- **Sources archive** — Software source copies on Hetzner.
- **Freescout** — Shared mailbox handling on DigitalOcean.
- **Mailing lists** — Mailman on infradead servers; primary developer communication channel.
- **Firmware selector** — Search and download interface for device-specific firmware.
- **Sysupgrade server** — Online ImageBuilder and upgrade functionality.

### Externally-managed

- **Patch tracking** — Patchwork on Ozlabs for mailing list patches.
- **Bug tracker and pull requests** — GitHub repositories.
- **DNS** — DigitalOcean managed service.
- **CDN** — Fastly content delivery network. Admin: aparcar.

## Hosting

### Servers

| Host         | Spec                                  | Services                  | Admin(s)            | Cost            | Comment              |
|--------------|---------------------------------------|---------------------------|---------------------|-----------------|----------------------|
| netcup       | RS 8000 G9.5 a1 12M + 6TB             | Downloads                 | aparcar             | Free            | Open source support  |
| DigitalOcean | 7 droplets                            | wiki, forum, git, mail    | Multiple            | Free            | Open source support  |
| Hetzner      | ax41-nvme                             | Buildbot master           | OpenWrt sysadmins   | 35 €/month      | Paid privately       |
| Hetzner      | sb59                                  | Archive                   | blogic              | 49.50 €/month   | Paid privately       |
| Hetzner      | ax61-nvme + 2× 1.92 TB SSD            | Downloads                 | jow                 | 158.27 €/month  | Paid privately       |

### Buildbot workers

| Host     | Name                | Spec                                                      | Quantity | Admin(s)               | Cost        | Comment                       |
|----------|---------------------|-----------------------------------------------------------|----------|------------------------|-------------|-------------------------------|
| Hetzner  | subnetica-dock-*    | AMD EPYC 7502P 32c/64t, SSD, 128 GB RAM                   | 1        | OpenWrt sysadmins      | 80 €/month  | Provided by Subnetica         |
| OVH      | robimarko-dock-01   | AMD EPYC 7351P 16c/32t, 128 GB RAM, 2× 500 GB NVMe        | 1        | robimarko, ynezz       | $43/month   | Paid privately                |
| OSUOSL   | osuosl-vm-*         | OpenStack VM (12c, 32 GB RAM, 320 GB disk)                | 4        | zorun, ynezz, jow      | Free        | Open source support           |
| OSUOSL   | osuosl-dock-*       | 12c/24t, 64 GB RAM (2× Xeon X5680)                        | 2        | OpenWrt sysadmins      | Free        | Open source support           |
| VZFFNRMO | vzffnrmo-dock-*     | AMD EPYC 7451, 100 GB RAM, 200 GB disk                    | 4        | OpenWrt sysadmins      | —           | Freifunk Karlsruhe Project    |
| FFFFM    | ffffm-dock-*        | 28c/56t, 448 GB RAM, 1.8 TB (2× Xeon E5-2680v4)           | 1        | OpenWrt sysadmins      | Free        | Freifunk Frankfurt am Main    |
| FFB      | ffb-dock-*          | 12c E5-2630, 64 GB RAM, 100 GB HDD                        | 1        | OpenWrt sysadmins      | Free        | Freifunk Berlin               |

#### Worker hardware requirements

- **CPU** — Phase 1 (images) workers need 4–8 cores; phase 2 (packages) needs 8–16 cores. Larger machines are split using Docker.
- **Memory** — Minimum 1 GB RAM per CPU thread; 2 GB/thread preferred. A 16-core/32-thread machine needs 32–64 GB total.
- **Disk** — Phase 1 (images) requires 50 GB; phase 2 (packages) requires 150 GB.

### Other costs

| Item          | Provider | Admin(s)              | Cost            | Comment                 |
|---------------|----------|-----------------------|-----------------|-------------------------|
| Domain names  | Tucows   | SPI Hostmaster, jow   | 20–40 €/year    | Held by Tucows for SPI  |

## Buildbot build matrix

| Version | Phase 1 — Images | Phase 2 — Packages | Fail logs          | Image downloads          |
|---------|------------------|--------------------|--------------------|--------------------------|
| main    | Phase 1 — Images | Phase 2 — Packages | Snapshots faillogs | Snapshots targets        |
| 25.12   | 25.12 Images     | 25.12 Packages     | 25.12 faillogs     | 25.12-SNAPSHOT targets   |
| 24.10   | 24.10 Images     | 24.10 Packages     | 24.10 faillogs     | 24.10-SNAPSHOT targets   |
| 23.05   | 23.05 Images     | 23.05 Packages     | 23.05 faillogs     | 23.05-SNAPSHOT targets   |

## Mirrors and archive

Third parties provide mirrors of the main OpenWrt download archive. See the mirrors page for details.

## Donations

See [Donate](/donate/) for how to contribute toward infrastructure costs.
