#!/bin/sh
# Split the wiki toh.json export into one JSON file per device.
#
# Reads the columnar export (`.columns` + `.entries[]`) and writes a flat
# key/value object per device into $OUT. The downloads page fetches one of
# these per row-expand instead of the 4 MB monolith.
#
# Filename rule: the part of `deviceid` after the colon (the wiki uses
# `vendor:id`). For the rare case where the wiki id doesn't match the
# buildbot's profile id (e.g. `openwrt:openwrt_one_1` → buildbot
# `openwrt_one`), add an entry to the case statement below.
#
# Usage:
#   scripts/split-toh.sh [INPUT] [OUTPUT_DIR]
# Defaults: ./static/toh/data.json -> ./static/toh/devices/
set -eu

IN="${1:-static/toh/data.json}"
OUT="${2:-static/toh/devices}"

if ! command -v jq >/dev/null 2>&1; then
  printf 'split-toh.sh: jq is required but not installed\n' >&2
  exit 1
fi

if [ ! -f "$IN" ]; then
  printf 'split-toh.sh: input file not found: %s\n' "$IN" >&2
  exit 1
fi

# Manual overrides: wiki deviceid → buildbot profile id.
# Keep this list small; only add when the wiki and the buildbot disagree.
remap() {
  case "$1" in
    openwrt:openwrt_one_1) printf '%s' 'openwrt_one' ;;
    *) return 1 ;;
  esac
}

mkdir -p "$OUT"
find "$OUT" -name '*.json' -type f -delete

TAB=$(printf '\t')

jq -rc '
  .columns as $cols
  | .entries[]
  | . as $entry
  | ([range(0; $cols | length)]
      | map({key: $cols[.], value: $entry[.]})
      | from_entries) as $obj
  | (($obj.deviceid // "_unknown") + "\t" + ($obj | tojson))
' "$IN" | while IFS="$TAB" read -r did json; do
  # Apply override if any, otherwise take the part after the colon.
  if name=$(remap "$did"); then
    :
  else
    case "$did" in
      *:*) name="${did#*:}" ;;
      *)   name="$did" ;;
    esac
  fi
  safe=$(printf '%s' "$name" | tr -c 'A-Za-z0-9._-' '_')
  printf '%s\n' "$json" >"$OUT/$safe.json"
done

count=$(find "$OUT" -name '*.json' -type f | wc -l | tr -d ' ')
printf 'split-toh.sh: %s -> %s/ (%s devices)\n' "$IN" "$OUT" "$count"
