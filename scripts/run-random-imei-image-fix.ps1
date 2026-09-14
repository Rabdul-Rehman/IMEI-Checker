$ErrorActionPreference = "Stop"
Set-Location "E:\IMEI-checker\imei.info2"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " RANDOM IMEI IMAGE FIX - ONE GO" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan

git pull origin main
if ($LASTEXITCODE -ne 0) { throw "git pull failed" }

Write-Host "[1/4] Building exact model -> verified image index..." -ForegroundColor Yellow
python ".\scripts\build-model-phone-image-index.py"
if ($LASTEXITCODE -ne 0) { throw "image index generation failed" }

Write-Host "[2/4] Production build..." -ForegroundColor Yellow
npm run cf:build
if ($LASTEXITCODE -ne 0) { throw "Cloudflare production build failed" }

Write-Host "[3/4] Commit..." -ForegroundColor Yellow
git add "src/data/modelPhoneImageIndex.js" "src/app/results/[imei]/page.js"
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "No new changes to commit." -ForegroundColor Yellow
} else {
    git commit -m "Resolve random IMEI images from verified model identity index"
    if ($LASTEXITCODE -ne 0) { throw "commit failed" }
}

Write-Host "[4/4] Push..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) { throw "push failed" }

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host " RANDOM IMEI IMAGE FIX COMPLETE" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Green
git log -1 --oneline
