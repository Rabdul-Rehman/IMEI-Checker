$ErrorActionPreference = "Stop"
$ROOT = "E:\IMEI-checker\imei.info2"
Set-Location $ROOT

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " EXACT LOW-RISK IMAGE REUSE - ONE GO" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$Audit = Get-ChildItem -Path $ROOT -Directory -Filter "FINAL-IMAGE-AUDIT-*" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $Audit) { throw "No FINAL-IMAGE-AUDIT-* folder found." }

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $ROOT "exact-reuse-backup-$Stamp"
$Report = Join-Path $ROOT "exact-reuse-report-$Stamp"
$Script = Join-Path $ROOT "scripts\reuse-exact-low-risk-images.py"

New-Item -ItemType Directory -Force $Backup | Out-Null
New-Item -ItemType Directory -Force $Report | Out-Null

Write-Host "[1/4] Reusing only exact LOW-risk model images..." -ForegroundColor Yellow
python $Script $Audit.FullName $Backup $Report
if ($LASTEXITCODE -ne 0) { throw "Exact reuse pass failed." }

Write-Host ""
Write-Host "[2/4] Building Cloudflare app..." -ForegroundColor Yellow
npm run cf:build
if ($LASTEXITCODE -ne 0) {
    Copy-Item (Join-Path $Backup "phoneImageMap.js") ".\src\data\phoneImageMap.js" -Force
    throw "Build failed. phoneImageMap.js restored."
}

Write-Host "[OK] Build passed." -ForegroundColor Green

git add src/data/phoneImageMap.js
$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host ""
    Get-Content (Join-Path $Report "SUMMARY.txt")
    Write-Host ""
    Write-Host "No safe exact reuse changes were available." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "[3/4] Committing corrections..." -ForegroundColor Yellow
git commit -m "Reuse verified exact-model phone images"
if ($LASTEXITCODE -ne 0) { throw "Commit failed." }

Write-Host ""
Write-Host "[4/4] Pushing to GitHub / Cloudflare..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) { throw "Push failed; commit remains local." }

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host " EXACT IMAGE REUSE COMPLETE" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Get-Content (Join-Path $Report "SUMMARY.txt")
Write-Host ""
git log -1 --oneline
