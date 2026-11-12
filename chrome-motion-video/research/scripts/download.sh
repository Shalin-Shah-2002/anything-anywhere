#!/bin/bash
# usage: dl.sh manifest outdir
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
while IFS=$'\t' read -r g u; do
  rel=$(echo "$u" | sed -E 's#^https://[^/]+/##; s#^chrome/static/##; s#^gweb-uniblog-publish-prod/##; s#^static/blog/chrome-at-io26/##')
  out="$2/$g/$rel"; mkdir -p "$(dirname "$out")"
  [ -s "$out" ] && continue
  code=$(curl -sSL -A "$UA" --max-time 120 --retry 2 -o "$out" -w "%{http_code}" "$u")
  [ "$code" = 200 ] || { echo "FAIL $code $u"; rm -f "$out"; }
done < "$1"
