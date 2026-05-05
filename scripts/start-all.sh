#!/usr/bin/env bash
# Copyright 2026 Masato Kobayashi
# SPDX-License-Identifier: Apache-2.0

# Start the Open_Duck_Mini_Viewer.
# Works on Linux, macOS, WSL.
# Usage:
#   ./scripts/start-all.sh
#   ./scripts/start-all.sh --no-browser
set -euo pipefail

open_browser="true"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-browser) open_browser="false"; shift;;
    *) echo "Unknown arg: $1" >&2; exit 1;;
  esac
done

root="$(cd "$(dirname "$0")/.." && pwd)"

if [[ ! -d "$root/node_modules" ]]; then
  echo "First-time setup needed..."
  "$root/scripts/setup.sh"
fi

open_url() {
  case "$OSTYPE" in
    msys*|cygwin*|win32) cmd.exe /c start "" "$1" >/dev/null 2>&1 || true;;
    darwin*)             open "$1" >/dev/null 2>&1 || true;;
    *)                   xdg-open "$1" >/dev/null 2>&1 || true;;
  esac
}

cleanup() {
  echo
  echo "Stopping..."
  [[ -n "${vite_pid:-}" ]] && kill "$vite_pid" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

echo "Starting Vite on http://localhost:5173"
( cd "$root" && npm run dev ) &
vite_pid=$!

if [[ "$open_browser" == "true" ]]; then
  echo "Waiting for Vite to come up..."
  deadline=$(( $(date +%s) + 30 ))
  while (( $(date +%s) < deadline )); do
    if curl -fsS -m 1 http://localhost:5173 >/dev/null 2>&1; then break; fi
    sleep 0.4
  done
  open_url "http://localhost:5173"
fi

echo
echo "Running. Ctrl+C to stop."
wait
