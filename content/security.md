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

{{< release-table >}}

Caveats:

- This timeline covers the core OpenWrt repository. External package feeds (hosted on GitHub) follow their own maintainer policies and may not support every release that the project itself still supports.
- Devices should run the latest stable release for the best security posture.

## Advisories

Vulnerabilities in components maintained by the OpenWrt project are tracked at [/advisories/](/advisories/). Each entry has affected versions, the fix landing point, and credits.

Additional advisories are published as **GitHub Security Advisories** on the relevant repositories under [github.com/openwrt](https://github.com/openwrt) — notably [openwrt/asu](https://github.com/openwrt/asu/security/advisories), where issues affecting Attended SysUpgrade are coordinated. When such a GitHub advisory affects shipped OpenWrt builds, it is mirrored to [/advisories/](/advisories/) as well; otherwise the GitHub repo is the authoritative source.

The list covers project-maintained components only; fixes for third-party components are backported into supported releases when they affect OpenWrt, but are not enumerated here.

{{< recent-advisories >}}

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
- **RSS:** [security advisory feed](/advisories/index.xml).
