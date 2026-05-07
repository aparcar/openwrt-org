---
title: "OpenWrt and LEDE merge back into a single project"
date: 2018-01-04
description: "Two years after the LEDE fork, the projects rejoin under the OpenWrt name with LEDE's governance and codebase."
---

OpenWrt and LEDE are merging back into a single project under the OpenWrt name. The split, which began in May 2016 when a group of developers forked off as LEDE, ends with both teams committing to a unified codebase and shared governance.

The merged project adopts the LEDE codebase as its foundation, with compatible OpenWrt patches integrated on top. Development moves to `git.openwrt.org` (mirrored on GitHub), and the rules established by the LEDE project — public mailing-list discussion, formal voting on contentious decisions, simpler commit access — carry forward unchanged. Members from both former projects continue working together under that single set of rules.

Release support is consolidated:

- Pre-15.05 OpenWrt CC releases are no longer supported.
- OpenWrt CC 15.05 receives only critical fixes.
- LEDE 17.01 continues to receive full security and bug-fix support.
- A new major release is planned in the coming months.

The Software in the Public Interest (SPI) continues to provide legal representation for the unified project. Open pull requests against the old codebases will be closed after 30 days; contributors are encouraged to resubmit against the merged repository. The forum and wiki domains remain separate for now while infrastructure consolidation proceeds.

The original announcement was sent to `openwrt-adm` by Hauke Mehrtens.
