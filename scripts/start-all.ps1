# Copyright 2026 Masato Kobayashi
# SPDX-License-Identifier: Apache-2.0

# Start the Open_Duck_Mini_Viewer.
# Usage:
#   .\scripts\start-all.ps1
#   .\scripts\start-all.ps1 -NoBrowser
param(
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$nodeModules = Join-Path $root "node_modules"

if (-not (Test-Path $nodeModules)) {
    Write-Host "First-time setup needed..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "setup.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

$args = "-NoExit -Command `"`$Host.UI.RawUI.WindowTitle='Open_Duck_Mini_Viewer'; Set-Location '$root'; npm run dev`""
Start-Process powershell -ArgumentList $args | Out-Null

if (-not $NoBrowser) {
    Write-Host "Waiting for Vite to come up..." -ForegroundColor Cyan
    $deadline = (Get-Date).AddSeconds(30)
    do {
        Start-Sleep -Milliseconds 400
        try {
            $r = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { break }
        } catch { }
    } while ((Get-Date) -lt $deadline)
    Start-Process "http://localhost:5173"
}

Write-Host ""
Write-Host "Running. Stop by closing the dev-server window." -ForegroundColor Green
