#!/usr/bin/env bash
# Smoke check for the Node runtime upgrade (LAB-2947).
#
# usage: smoke.sh <base-url> [cookie-header]
#
# Prints one line per path: `path status content-type marker`, where marker is the
# page <title> (HTML), the byte size (images, text) or an error flag. Run it against the
# old and the new runtime and diff the output; status and content type must match.
# Detail pages, the job OG image and the optimised image are discovered from the list
# pages, so the script works against any environment.
set -u

BASE=${1:?usage: smoke.sh <base-url> [cookie-header]}
BASE=${BASE%/}
COOKIE=${2:-}
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

fetch() { # fetch <path> <outfile> → prints "status content-type"
  local args=(-s -m 60 -o "$2" -w '%{http_code} %{content_type}')
  [ -n "$COOKIE" ] && args+=(-H "Cookie: $COOKIE")
  curl "${args[@]}" "$BASE$1"
}

check() { # check <path> [label]
  local path=$1 label=${2:-$1} out="$TMP/body" res status ctype marker
  res=$(fetch "$path" "$out")
  status=${res%% *}
  ctype=${res#* }
  ctype=${ctype%%;*}
  if [[ $ctype == text/html* ]]; then
    marker=$(tr -d '\n' < "$out" | grep -oE '<title[^>]*>[^<]*</title>' | head -1 | sed -E 's/<[^>]+>//g')
    grep -qE 'Application error|Internal Server Error|digest:' "$out" && marker="$marker [ERROR-MARKER]"
  else
    marker="$(wc -c < "$out" | tr -d ' ')B"
  fi
  printf '%s %s %s %s\n' "$label" "$status" "${ctype:-none}" "${marker:-no-title}"
}

first_link() { # first_link <list-path> <prefix-regex>
  fetch "$1" "$TMP/list" > /dev/null
  grep -oE "href=\"$2/[^\"?#/]+\"" "$TMP/list" | head -1 | sed -E 's/^href="|"$//g'
}

for p in / /home /members /teams /projects /events /forum /jobs /ai-search /explore-pl-network; do
  check "$p"
done

for kind in members teams projects; do
  link=$(first_link "/$kind" "/$kind")
  if [ -n "$link" ]; then check "$link" "/$kind/<first>"; else echo "/$kind/<first> no-link-found"; fi
done

job=$(first_link /jobs /jobs/openings)
if [ -n "$job" ]; then check "/api/og/jobs/${job##*/}" "/api/og/jobs/<first>"; else echo "/api/og/jobs/<first> no-link-found"; fi

img=$(grep -oE 'https://[^" ]+\.(png|jpe?g|webp)' "$TMP/list" | head -1)
if [ -z "$img" ]; then
  fetch /members "$TMP/list" > /dev/null
  img=$(grep -oE 'https://[^" ]+\.(png|jpe?g|webp)' "$TMP/list" | head -1)
fi
if [ -n "$img" ]; then
  enc=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1],safe=""))' "$img")
  check "/_next/image?url=$enc&w=64&q=75" "/_next/image"
else
  echo "/_next/image no-image-found"
fi

for p in /sitemap.xml /robots.txt /llms.txt; do
  check "$p"
done
check /zz-smoke-unknown-path-404 "/<unknown>"

if [ -n "$COOKIE" ]; then
  for p in /settings /notifications /pl-infra/ai-apps; do
    check "$p"
  done
fi
