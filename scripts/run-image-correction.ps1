$ErrorActionPreference = "Stop"

$ROOT = "E:\IMEI-checker\imei.info2"
Set-Location $ROOT

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " STRICT SELECTIVE PHONE IMAGE CORRECTION - ONE GO" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$Audit = Get-ChildItem -Path $ROOT -Directory -Filter "FINAL-IMAGE-AUDIT-*" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $Audit) {
    throw "No FINAL-IMAGE-AUDIT-* folder found in $ROOT"
}

$AuditCsv = Join-Path $Audit.FullName "ALL-MAPPINGS-AUDIT.csv"
if (-not (Test-Path $AuditCsv)) {
    throw "ALL-MAPPINGS-AUDIT.csv missing from $($Audit.FullName)"
}

$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Backup = Join-Path $ROOT "image-correction-backup-$Stamp"
$Report = Join-Path $ROOT "image-correction-report-$Stamp"
$Script = Join-Path $ROOT "scripts\fix-phone-images-from-audit.py"

New-Item -ItemType Directory -Force $Backup | Out-Null
New-Item -ItemType Directory -Force $Report | Out-Null

Write-Host "Audit : $($Audit.FullName)"
Write-Host "Backup: $Backup"
Write-Host "Report: $Report"
Write-Host ""

if (-not (Test-Path $Script)) {
    throw "Correction script missing: $Script"
}

Write-Host "[1/5] Running strict exact-model correction..." -ForegroundColor Yellow
python $Script $Audit.FullName $Backup $Report
if ($LASTEXITCODE -ne 0) {
    throw "Image correction script failed."
}

Write-Host ""
Write-Host "[2/5] Running production Cloudflare build..." -ForegroundColor Yellow
npm run cf:build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Rolling map/images back..." -ForegroundColor Red

    $MapBackup = Join-Path $Backup "phoneImageMap.js"
    if (Test-Path $MapBackup) {
        Copy-Item $MapBackup ".\src\data\phoneImageMap.js" -Force
    }

    $Accepted = Join-Path $Report "ACCEPTED.csv"
    if ((Test-Path $Accepted) -and ((Get-Item $Accepted).Length -gt 3)) {
        Import-Csv $Accepted | ForEach-Object {
            $rel = [string]$_.new_image
            if ($rel) {
                $local = Join-Path $ROOT ("public\" + $rel.TrimStart("/").Replace("/", "\"))
                if ((Test-Path $local) -and ((Split-Path $local -Leaf) -like "auditfix-*")) {
                    Remove-Item $local -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }

    throw "Cloudflare build failed. Working mapping was restored."
}

Write-Host "[OK] Cloudflare build passed." -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Preparing only correction files for Git..." -ForegroundColor Yellow

git add src/data/phoneImageMap.js
Get-ChildItem ".\public\phone-images" -Filter "auditfix-*.webp" -File -ErrorAction SilentlyContinue |
    ForEach-Object { git add -- $_.FullName }

$staged = git diff --cached --name-only

if (-not $staged) {
    Write-Host ""
    Write-Host "No high-confidence replacements were accepted." -ForegroundColor Yellow
    Write-Host "Nothing was committed or deployed." -ForegroundColor Yellow
    Write-Host ""
    Get-Content (Join-Path $Report "SUMMARY.txt")
    exit 0
}

Write-Host ""
Write-Host "[4/5] Committing exact image corrections..." -ForegroundColor Yellow

git commit -m "Correct high-confidence phone image mismatches"

if ($LASTEXITCODE -ne 0) {
    throw "Git commit failed."
}

Write-Host ""
Write-Host "[5/5] Pushing to GitHub / Cloudflare..." -ForegroundColor Yellow

git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Push failed, but the correction commit is safely stored locally." -ForegroundColor Red
    Write-Host "Run later: git push origin main" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host " IMAGE CORRECTION COMPLETE" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

Get-Content (Join-Path $Report "SUMMARY.txt")

Write-Host ""
Write-Host "Git commit:" -ForegroundColor Cyan
git log -1 --oneline

Write-Host ""
Write-Host "Cloudflare should now build the new main commit automatically." -ForegroundColor Cyan
Write-Host "Report folder: $Report" -ForegroundColor DarkGray
Write-Host "Backup folder: $Backup" -ForegroundColor DarkGray
