---
title: "Submitting Patches"
description: "How to send code changes to the OpenWrt project."
---

OpenWrt accepts patches via the developer mailing list and via GitHub pull requests. Pick the destination based on which tree your change touches.

## Where to send patches

| Area                                  | Repository                                                              |
|---------------------------------------|-------------------------------------------------------------------------|
| Core / new device support             | [openwrt/openwrt](https://github.com/openwrt/openwrt)                   |
| LuCI web interface                    | [openwrt/luci](https://github.com/openwrt/luci)                         |
| Miscellaneous community packages      | [openwrt/packages](https://github.com/openwrt/packages)                 |
| Community routing packages            | [openwrt-routing/packages](https://github.com/openwrt-routing/packages) |
| Telephony / SIP / VoIP packages       | [openwrt/telephony](https://github.com/openwrt/telephony)               |

For mailing-list submissions, send to [openwrt-devel](https://lists.openwrt.org/mailman/listinfo/openwrt-devel). Look for `MAINTAINER` macros in the relevant Makefile and CC the maintainer if one is listed. Track patches on [Patchwork](https://patchwork.ozlabs.org/project/openwrt/list/).

## Commit format

A good OpenWrt commit:

- Has a single subject under 50 characters in the form `prefix: imperative summary` (prefix is the package name, target, tool, or `kernel`/`build`).
- Uses imperative mood: *add support for X*, not *added support for X*.
- Has a blank line between subject and body.
- Wraps the body at ~75 characters.
- Explains *why* the change is needed, not just *what* changed. Reference bug reports by ID where applicable.
- Ends with a `Signed-off-by:` line — your real name and a real email — certifying the [Developer's Certificate of Origin 1.1](https://developercertificate.org/). `git commit -s` adds it automatically.

For changes you didn't author yourself, preserve the original signoffs and add your own at the end. Maintainer notes about modifications go in brackets between the signoffs:

```
Signed-off-by: Random Developer <random@developer.example.org>
[maintainer@example.org: rebased on master]
Signed-off-by: Lucky Maintainer <lucky@maintainer.example.org>
```

## Style

- Match the indentation of the surrounding file.
- Keep lines to 80 characters where reasonable.
- Run `./scripts/checkpatch.pl` against your patch (it produces some false positives, but the output is worth a glance).
- Group logical changes into separate commits. Don't fold a bug fix and a feature into the same commit.

## DTS submissions

When adding or modifying device-tree source files:

- Include a license header. `SPDX-License-Identifier: GPL-2.0-or-later OR MIT` is the recommended choice for new files.
- Drop `default-state = "off"` from LED nodes (it's the default).
- For MTD partitions exposing firmware images, use the appropriate `compatible` property so the bootloader/sysupgrade can find them.
- Where possible, dedicate one or two LEDs as system-status indicators in `diag.sh`.
- Name nodes by function (e.g. `wan-led`), not by the model.
- Drop deprecated `device_type` properties except on `memory` and `cpu` nodes.

## Pull requests

For GitHub PRs:

- Use a separate branch per PR.
- One commit per logical change. Squash fixup commits before opening or updating the PR.
- Open the PR against `main`. Bug-fix backports to a release branch should cherry-pick from `main` with `git cherry-pick -x` so the trailer includes the source commit.

## Mailing-list submissions

If you send patches by email rather than as a PR:

- Send patches **inline as plain text**. No MIME, no attachments, no compression, no flowed text. (Mozilla Thunderbird users: enable plain-text composition and disable flowed text.)
- Prefix the subject with `[PATCH]`. For series, use `[PATCH 01/N]` format so they sort correctly.
- Patches over ~300 kB should be hosted somewhere reachable and submitted as a URL instead of inline.
- Include the full description on every resubmission — don't make reviewers dig through prior threads.

## Trailer tags

Beyond `Signed-off-by:`, OpenWrt follows the kernel community's conventions:

- `Acked-by:` — reviewer agrees with the patch but didn't develop it.
- `Reviewed-by:` — reviewer has done a technical review and considers the patch acceptable.
- `Tested-by:` — patch was tested in a particular environment.
- `Reported-by:` — credits the bug reporter (don't add without their permission, especially for non-public reports).
- `Cc:` — flags interested parties without requiring action from them.

## Pre-submission checklist

1. Single commit per logical change; multi-step work is split into a series.
2. Subject line ≤ 50 characters.
3. Blank line between subject and body.
4. Body wraps at ~75 characters and explains the *why*.
5. `Signed-off-by:` is present with real name and email.
6. Author name/email matches the `Signed-off-by:` line.
7. Style-checked with `checkpatch.pl`.
