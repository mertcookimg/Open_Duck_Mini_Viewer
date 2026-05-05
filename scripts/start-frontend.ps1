# Copyright 2026 Masato Kobayashi
# SPDX-License-Identifier: Apache-2.0

# Start the Open_Duck_Mini_Viewer dev server (Vite).
# Usage:  .\scripts\start-frontend.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Push-Location $root
try {
    $needsInstall = $false
    if (-not (Test-Path "node_modules")) {
        $needsInstall = $true
    } else {
        $pkg = (Get-Item "package.json").LastWriteTime
        $mod = (Get-Item "node_modules").LastWriteTime
        if ($pkg -gt $mod) { $needsInstall = $true }
    }
    if ($needsInstall) {
        Write-Host "Installing / updating dependencies..." -ForegroundColor Cyan
        npm install
    }
    npm run dev
} finally {
    Pop-Location
}
