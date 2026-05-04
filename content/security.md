---
title: "Security"
description: "How to report a vulnerability, which OpenWrt versions are still receiving fixes, and how the project identifies and ships security updates."
---

This page covers the project's security policy: how to report a vulnerability, which releases are still receiving security fixes, the tools used to identify problems, and how fixes reach end users. It applies to the OpenWrt distribution and to project-maintained components such as procd, ubus, and libubox.

## Reporting a vulnerability

Send security bug reports in confidence to [contact@openwrt.org](mailto:contact@openwrt.org). The mailbox is monitored, but not always promptly. If you do not receive an acknowledgement within a reasonable time and the issue is severe, send a short note to the public mailing list [openwrt-adm@lists.openwrt.org](mailto:openwrt-adm@lists.openwrt.org) saying that a vulnerability has been reported privately and indicating its general severity. Do not include exploitation details, the vulnerable component, or proof-of-concept code in the public message.

Note: the openwrt-adm list rejects HTML mail. Configure your client to send plaintext.

For non-security bugs, see [Reporting bugs](/bugs/).

## Supported releases

OpenWrt provides security fixes only for the most recent two stable series. The status of each release is one of:

- **Supported** — both security fixes and other bug fixes are issued.
- **Security maintenance** — only security fixes are issued.
- **End of life (EoL)** — no further updates, including for severe vulnerabilities. Upgrade.

A new major release enters *Supported* status. When the next major release ships, the previous one drops to *Security maintenance*. A release reaches *EoL* one year after its initial release, or six months after its successor ships, whichever is later. A final minor release is normally cut at the end of the support cycle.

| Series | Status               | Initial release | Latest minor | Latest release date | EoL (projected) |
|--------|----------------------|-----------------|--------------|---------------------|-----------------|
| 25.12  | Supported            | 2026-03-06      | 25.12.2      | 2026-03-27          | TBD             |
| 24.10  | Security maintenance | 2025-02-06      | 24.10.6      | 2026-03-18          | 2026-09         |
| 23.05  | End of life          | 2023-10-13      | 23.05.6      | 2025-08-20          | 2025-08         |
| 22.03  | End of life          | 2022-09-06      | 22.03.7      | 2024-07-25          | 2024-07         |
| 21.02  | End of life          | 2021-09-04      | 21.02.7      | 2023-05-01          | 2023-05         |
| 19.07  | End of life          | 2020-01-06      | 19.07.10     | 2022-04-20          | 2022-04         |
| 18.06  | End of life          | 2018-07-31      | 18.06.9      | 2020-12-09          | 2020-12         |
| 17.01  | End of life          | 2017-02-22      | 17.01.7      | 2019-06-20          | 2019-06         |

Caveats:

- This timeline covers the core OpenWrt repository. External package feeds (hosted on GitHub) follow their own maintainer policies and may not support every release that the project itself still supports.
- Devices should run the latest stable release for the best security posture.

## Advisories

Each row links to the full advisory on the wiki, with affected versions, fixed versions, technical details, and credits. This list covers components directly maintained by the OpenWrt project; it does not enumerate fixes for third-party components, although those are backported into supported releases when they affect OpenWrt.

| Date       | CVE | Summary |
|------------|-----|---------|
| 2025-12-16 | CVE-2025-14282 | [Dropbear privilege escalation via Unix domain socket forwarding](https://openwrt.org/advisory/2025-12-16-1) |
| 2025-10-22 | CVE-2025-62525 | [ltq-ptm: local privilege escalation](https://openwrt.org/advisory/2025-10-22-2) |
| 2025-10-22 | CVE-2025-62526 | [ubusd: heap buffer overflow](https://openwrt.org/advisory/2025-10-22-1) |
| 2024-12-06 | CVE-2024-54143 | [Attended SysUpgrade server: build-artifact poisoning via truncated SHA-256 and command injection](https://openwrt.org/advisory/2024-12-06) |
| 2022-10-17 | CVE-2022-41674, -42719, -42720, -42721, -42722 | [Multiple issues in mac80211 and cfg80211](https://openwrt.org/advisory/2022-10-17-1) |
| 2022-10-04 | CVE-2022-39173 | [wolfSSL buffer overflow during a TLS 1.3 handshake](https://openwrt.org/advisory/2022-10-04-1) |
| 2021-08-01 | CVE-2021-28961 | [luci-app-ddns: multiple authenticated RCEs](https://openwrt.org/advisory/2021-08-01-3) |
| 2021-08-01 | CVE-2021-33425 | [Stored XSS in hostname UCI variable](https://openwrt.org/advisory/2021-08-01-2) |
| 2021-08-01 | CVE-2021-32019 | [XSS via missing input validation of displayed hostnames](https://openwrt.org/advisory/2021-08-01-1) |
| 2021-02-02 | CVE-2020-36177 | [wolfSSL heap buffer overflow in `RsaPad_PSS`](https://openwrt.org/advisory/2021-02-02-2) |
| 2021-02-02 | CVE-2021-22161 | [netifd and odhcp6c routing loop on IPv6 point-to-point links](https://openwrt.org/advisory/2021-02-02-1) |
| 2021-01-19 | CVE-2020-25681 … CVE-2020-25687 | [dnsmasq multiple vulnerabilities](https://openwrt.org/advisory/2021-01-19-1) |
| 2021-01-17 | —             | [OpenWrt forum break-in on 16 Jan 2021](https://openwrt.org/advisory/2021-01-17-1) |
| 2020-12-09 | CVE-2020-28951 | [libuci import: heap use-after-free](https://openwrt.org/advisory/2020-12-09-2) |
| 2020-12-09 | CVE-2020-25705 | [Linux kernel ICMP rate-limit DNS-poisoning facilitator](https://openwrt.org/advisory/2020-12-09-1) |
| 2020-05-06 | CVE-2020-11752 | [relayd: out-of-bounds heap reads and possible buffer overflow](https://openwrt.org/advisory/2020-05-06-2) |
| 2020-05-06 | CVE-2020-11750 | [umdns: out-of-bounds heap reads and possible buffer overflow](https://openwrt.org/advisory/2020-05-06-1) |
| 2020-02-21 | CVE-2020-8597 | [ppp buffer overflow](https://openwrt.org/advisory/2020-02-21-1) |
| 2020-01-31 | CVE-2020-7248 | [libubox tagged binary data JSON serialization vulnerability](https://openwrt.org/advisory/2020-01-31-2) |
| 2020-01-31 | CVE-2020-7982 | [opkg susceptible to MITM](https://openwrt.org/advisory/2020-01-31-1) |
| 2020-01-13 | CVE-2019-19945 | [uhttpd invalid data access via HTTP POST request](https://openwrt.org/advisory/2020-01-13-1) |
| 2019-11-05 | CVE-2019-5101, -5102 | [ustream-ssl information disclosure](https://openwrt.org/advisory/2019-11-05-3) |
| 2019-11-05 | CVE-2019-17367 | [LuCI CSRF vulnerability](https://openwrt.org/advisory/2019-11-05-2) |
| 2019-11-05 | —             | [LuCI stored XSS](https://openwrt.org/advisory/2019-11-05-1) |

## How problems get found

The project uses a number of tools to surface security issues. Output from each is public — fixes from anyone are welcome.

- **[uscan report](https://sdwalker.github.io/uscan/index.html).** Compares the package version in the OpenWrt tree against upstream releases and cross-references the [CPE](https://nvd.nist.gov/products/cpe) declared in each package's `PKG_CPE_ID` against published CVEs. Updated weekly for `main` and the active release branches.
- **[Coverity Scan](https://scan.coverity.com/projects/openwrt).** Static analysis runs once a week against the OpenWrt build and reports defects in project-maintained components (procd, ubus, etc.). Findings on patched third-party components are not reported.
- **[Reproducible builds](https://reproducible.debian.net/openwrt/openwrt.html).** Independent rebuilds verify that the published release artifacts match the source — a check against build-system tampering and accidental backdoors.

## How fixes reach users

The project runs buildbot instances that continuously build snapshots of `main` and each supported release branch. When a fix lands in a package, the buildbot rebuilds it; the new package becomes installable via `opkg` and via the [Attended SysUpgrade](https://openwrt.org/docs/guide-user/installation/attended.sysupgrade) flow within roughly two days.

The kernel and kernel modules are not updatable through this path because the kernel lives in its own partition and is part of the firmware image. Kernel security fixes ship as a new minor release.

## Hardening build flags

OpenWrt enables a number of compile-time hardening options for all package builds. Individual packages or targets may opt out.

| `.config` symbol                           | Default | Effect |
|--------------------------------------------|---------|--------|
| `CONFIG_PKG_CHECK_FORMAT_SECURITY=y`       | yes     | `-Wformat -Werror=format-security` |
| `CONFIG_PKG_CC_STACKPROTECTOR_REGULAR=y`   | yes     | `-fstack-protector` |
| `CONFIG_PKG_CC_STACKPROTECTOR_STRONG=y`    | no      | `-fstack-protector-strong` |
| `CONFIG_KERNEL_CC_STACKPROTECTOR_REGULAR=y`| yes     | Kernel `CONFIG_STACKPROTECTOR` |
| `CONFIG_KERNEL_CC_STACKPROTECTOR_STRONG=y` | no      | Kernel `CONFIG_STACKPROTECTOR_STRONG` |
| `CONFIG_PKG_FORTIFY_SOURCE_1=y`            | yes     | `-D_FORTIFY_SOURCE=1` (uses [fortify-headers](https://git.2f30.org/fortify-headers/) on musl) |
| `CONFIG_PKG_FORTIFY_SOURCE_2=y`            | no      | `-D_FORTIFY_SOURCE=2` (uses [fortify-headers](https://git.2f30.org/fortify-headers/) on musl) |
| `CONFIG_PKG_RELRO_FULL=y`                  | yes     | `-Wl,-z,now -Wl,-z,relro` |
| `CONFIG_PKG_ASLR_PIE_REGULAR=y`            | yes     | `-fPIC` plus `-specs=hardened-build-ld`. PIE is enabled for selected (mostly network-exposed) binaries. |
| `CONFIG_PKG_ASLR_PIE_ALL=y`                | no      | PIE for all binaries. |
| `CONFIG_KERNEL_SECCOMP`                    | yes     | Kernel `CONFIG_SECCOMP` |
| `CONFIG_SELINUX`                           | no      | Kernel `SECURITY_SELINUX` |

## Subscribing

- **Mailing list:** [openwrt-announce](https://lists.openwrt.org/mailman/listinfo/openwrt-announce) carries release and security announcements.
- **RSS:** [security advisory feed](https://openwrt.org/feed.php?type=rss&mode=list&sort=date&ns=advisory&linkto=current&content=html).
