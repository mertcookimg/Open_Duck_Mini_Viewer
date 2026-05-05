#!/usr/bin/env bash
# Copyright 2026 Masato Kobayashi
# SPDX-License-Identifier: Apache-2.0

# One-time setup: install Node dependencies.
# Works on Linux, macOS, WSL, and Git Bash on Windows.
# Usage:  ./scripts/setup.sh
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "WARNING: Node.js is not installed. Get it from https://nodejs.org (LTS) and re-run." >&2
  exit 1
fi
echo "Installing dependencies..."
( cd "$root" && npm install )

echo
echo "Setup complete."
echo
echo "Next:"
echo "  ./scripts/start-frontend.sh   # or  ./scripts/start-all.sh"
echo "  Browser:  http://localhost:5173"
