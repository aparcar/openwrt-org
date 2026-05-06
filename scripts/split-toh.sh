#!/bin/sh
# Split the wiki toh.json export into one JSON file per device.
#
# Reads the columnar export (with `.columns` and `.entries`) and emits a
# flat key-indexed object per device into $OUT. The downloads page fetches
# only the device it needs instead of the 4 MB monolith.
#
# Usage:
#   scripts/split-toh.sh [INPUT] [OUTPUT_DIR]
#
# Defaults: ./static/toh/data.json -> ./static/toh/devices/
#
# Run locally with the data already fetched, or via the CI step in
# .forgejo/workflows/deploy.yml.

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

mkdir -p "$OUT"
# Wipe stale per-device files so removed/renamed devices do not linger.
find "$OUT" -name '*.json' -type f -delete

TAB=$(printf '\t')

# Stream one line per device as "<deviceid><TAB><object as JSON>".
# tojson never produces literal tabs or newlines (escapes them as \t / \n)
# and -c keeps each value on a single line, so the TAB split is unambiguous.
jq -rc '
  .columns as $cols
  | .entries[]
  | . as $entry
  | ([range(0; $cols | length)]
      | map({key: $cols[.], value: $entry[.]})
      | from_entries) as $obj
  | (($obj.deviceid // "_unknown") + "\t" + ($obj | tojson))
' "$IN" | while IFS="$TAB" read -r did json; do
  # The buildbot profile id is the part after the colon in `vendor:id`.
  case "$did" in
    *:*) name="${did#*:}" ;;
    *)   name="$did" ;;
  esac
  # Filename: only safe characters.
  safe=$(printf '%s' "$name" | tr -c 'A-Za-z0-9._-' '_')
  printf '%s\n' "$json" >"$OUT/$safe.json"
done

count=$(find "$OUT" -name '*.json' -type f | wc -l | tr -d ' ')
printf 'split-toh.sh: %s -> %s/ (%s devices)\n' "$IN" "$OUT" "$count"
