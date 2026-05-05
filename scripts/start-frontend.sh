#!/usr/bin/env bash
# Copyright 2026 Masato Kobayashi
# SPDX-License-Identifier: Apache-2.0

# Start the Open_Duck_Mini_Viewer dev server (Vite).
# Usage:  ./scripts/start-frontend.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"

needs_install="false"
if [[ ! -d node_modules ]]; then
  needs_install="true"
elif [[ package.json -nt node_modules ]]; then
  needs_install="true"
fi
if [[ "$needs_install" == "true" ]]; then
  echo "Installing / updating dependencies..."
  npm install
fi
exec npm run dev
