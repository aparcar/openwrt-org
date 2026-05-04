---
title: "A new home for openwrt.org's basic pages"
date: 2026-05-04
description: "We're moving the static parts of the project site off the wiki to a faster, mobile-friendly stack."
---

We've started rebuilding openwrt.org's static pages — About, Rules, Trademark, License, and friends — on a static site generator. The wiki and forum continue to live where they are; this rebuild only covers the front door.

Three reasons for the change:

1. **Mobile.** Most visitors land on a phone, and the current Bootstrap-3-on-DokuWiki layout has been showing its age.
2. **A real news section.** Until now, announcements have been wedged into the homepage. They deserve their own feed (and an RSS feed comes for free).
3. **Easier contributions.** Markdown in a git repo lowers the bar for community edits, and review can happen as PRs.

Source lives in the project's website repository. Issues and pull requests welcome.
