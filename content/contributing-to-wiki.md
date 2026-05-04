---
title: "Contributing to the Wiki"
description: "How to get an account on openwrt.org/docs and what good wiki contributions look like."
---

The OpenWrt documentation lives in a DokuWiki at [openwrt.org/docs](https://openwrt.org/docs/start). It is maintained by the community.

## Getting an account

Self-registration is disabled to keep the wiki spam-free. Apply for editor access via the forum thread [Applying for OpenWrt wiki account](https://forum.openwrt.org/t/applying-for-openwrt-wiki-account/101671) or ask on IRC.

## What makes a good wiki article

These principles guide existing wiki content; new contributions should follow them:

- **Keep it simple.** Use the editor's basic formatting, plus code blocks and tables where they help. Articles need to be easy to read and easy for the next person to edit.
- **Don't duplicate within the wiki.** If a procedure already exists elsewhere, link to it instead of copying. One canonical version per topic.
- **Don't duplicate upstream.** Generic Linux/networking content belongs upstream; the wiki should link to it.
- **Target the current stable release.** Mark deprecated or experimental material clearly.
- **Be findable.** Titles and intros should contain the keywords readers will actually search for. Short and descriptive beats long and clever.
- **Open with the goal.** The first paragraph should tell the reader what the article does for them and when to use it.
- **Verify what you write.** Speculation should be labelled as such. Cite sources for non-obvious claims.
- **Test tutorials.** If you can't test a procedure yourself, say so in the article and ask someone to verify and remove the warning.
- **One topic per article.** If a procedure has many branches or is very long, split it.
- **Make it discoverable.** New articles should be linked from a category page or a closely related article.

## Wiki structure

The wiki is organised into namespaces (top-level sections, max three sublevels deep):

- `about` — project information
- `toh` — Table of Hardware (supported devices)
- `packages` — package listings
- `downloads` — release information
- `docs` — main documentation tree
- `wiki` — wiki rules and meta
- `faq`
- `inbox` — work-in-progress drafts
- `playground` — for testing markup

Documentation under `docs` is split into three guides: **Quick Start**, **User Guide**, and **Developer Guide**. Tags allow articles to belong to multiple topics simultaneously.

## License

Wiki content is licensed under [CC Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/) unless noted otherwise. Submitting an edit means you agree to license your contribution under the same terms.
