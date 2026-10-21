#!/bin/sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
NODE_BIN=''
try_node() {
  candidate=$1
  [ -f "$candidate" ] && [ -x "$candidate" ] || return 0
  if "$candidate" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 22 ? 0 : 1)' >/dev/null 2>&1; then NODE_BIN=$candidate; fi
}
if [ -n "${NINEBIZ_NODE:-}" ]; then try_node "$NINEBIZ_NODE"; fi
if [ -z "$NODE_BIN" ]; then
  path_node=$(command -v node 2>/dev/null || true)
  if [ -n "$path_node" ]; then try_node "$path_node"; fi
fi
for install_root in "${NINEBIZ_INSTALL_ROOT:-}" "${NINEBIZ_CLI_ROOT:-}" "${HOME:-}/.9bizclaw" "${HOME:-}/Library/Application Support/9BizClaw-v3" '/Applications/9BizClaw.app/Contents/Resources'; do
  [ -z "$NODE_BIN" ] || break
  [ -n "$install_root" ] || continue
  for relative in vendor/node/bin/node vendor/node/node bin/node; do
    try_node "$install_root/$relative"
    [ -z "$NODE_BIN" ] || break
  done
done
if [ -z "$NODE_BIN" ]; then
  printf '%s\n' 'Node.js 22+ not found. Set NINEBIZ_NODE to the Node executable bundled with 9B and retry.' >&2
  exit 1
fi
exec "$NODE_BIN" "$SCRIPT_DIR/install.cjs" "$@"
