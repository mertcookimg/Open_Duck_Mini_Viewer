# Copyright 2026 Masato Kobayashi
# SPDX-License-Identifier: Apache-2.0

# One-time setup: install Node dependencies.
# Usage:  .\scripts\setup.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Warning "Node.js is not installed. Get it from https://nodejs.org (LTS) and re-run."
    return
}
Write-Host "Installing dependencies..." -ForegroundColor Cyan
Push-Location $root
try {
    npm install
} finally {
    Pop-Location
}

Write-Host "Setup complete." -ForegroundColor Green
Write-Host ""
Write-Host "Next:" -ForegroundColor Yellow
Write-Host "  .\scripts\start-frontend.ps1   # or  .\scripts\start-all.ps1"
Write-Host "  Browser:  http://localhost:5173"
