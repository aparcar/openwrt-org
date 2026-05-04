---
title: "Reporting Bugs"
description: "Where and how to file bug reports against OpenWrt."
---

If you're not sure whether what you're seeing is a bug, ask first on the [forum](/contact/), [IRC, or the mailing list](/contact/) before opening an issue. Reproducible bugs in current releases belong in the issue trackers below.

## Issue trackers

| Tracker                                                            | Scope                            |
|--------------------------------------------------------------------|----------------------------------|
| [openwrt/openwrt](https://github.com/openwrt/openwrt/issues)       | Core build system, kernel, target/device support |
| [openwrt/packages](https://github.com/openwrt/packages/issues)     | Community packages               |
| [openwrt/luci](https://github.com/openwrt/luci/issues)             | LuCI web interface               |

If you're not sure where the affected component lives, check the [Packages tables](https://openwrt.org/packages/start) on the wiki.

## What to include

A useful bug report tells someone who has never seen your setup how to reproduce the problem:

- **Version** — the exact branch, release, or commit (e.g. `OpenWrt 24.10.1` or a `main` snapshot date).
- **Device** — model and revision; output of `cat /tmp/sysinfo/board_name` is helpful.
- **Expected vs. actual behaviour** — what should have happened and what did happen.
- **Reproduction steps** — minimal sequence that triggers the issue.
- **Workarounds tried** — what you've already ruled out, with the result.
- **Logs** — relevant lines from `logread`, `dmesg`, or service logs. Trim to the relevant section.

For background on writing a report that will get attention, Simon Tatham's [How to Report Bugs Effectively](https://www.chiark.greenend.org.uk/~sgtatham/bugs.html) is the classic reference.

Filing a bug raises awareness; it does not guarantee a fix. Patches and reproducible test cases substantially improve the odds.

## UI bugs (LuCI)

For LuCI bugs, document the click path:

1. Starting state — was the device freshly flashed, or upgraded with retained settings?
2. Pages visited, in order.
3. Buttons pressed, fields edited, options selected.
4. Whether **Save & Apply** was clicked.
5. The exact error message or unexpected behaviour observed.

A screenshot or short screencast is often the fastest way to communicate a UI issue.

## Security vulnerabilities

Do **not** open a public issue for a suspected security vulnerability. Follow the procedure in the [security guide](https://openwrt.org/docs/guide-developer/security).
