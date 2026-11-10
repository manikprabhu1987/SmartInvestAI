#!/bin/sh
set -eu

api_origin="${SMARTINVEST_API_ORIGIN:-}"
api_proxy_target="${API_PROXY_TARGET:-http://backend:8080}"

if [ -n "$api_origin" ] && ! printf '%s' "$api_origin" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?(/api/v1)?$'; then
  echo "SMARTINVEST_API_ORIGIN must be an HTTP(S) origin with an optional /api/v1 path." >&2
  exit 1
fi

if ! printf '%s' "$api_proxy_target" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$'; then
  echo "API_PROXY_TARGET must be an HTTP(S) origin without a path." >&2
  exit 1
fi

sed "s|@API_PROXY_TARGET@|$api_proxy_target|g" \
  /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf
printf 'window.__SMARTINVEST_CONFIG__ = { apiOrigin: "%s" };\n' "$api_origin" \
  > /usr/share/nginx/html/runtime-config.js

exec "$@"
