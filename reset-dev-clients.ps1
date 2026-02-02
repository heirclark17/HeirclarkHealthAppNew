# Reset All Development Clients
# This script clears all caches and resets the development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESET ALL DEV CLIENTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill Node.js processes
Write-Host "[1/7] Killing all Node.js processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "  ✓ Node.js processes killed" -ForegroundColor Green
Write-Host ""

# Clear Expo cache
Write-Host "[2/7] Clearing Expo cache..." -ForegroundColor Yellow
Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".expo-shared" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Expo cache cleared" -ForegroundColor Green
Write-Host ""

# Clear Metro bundler cache
Write-Host "[3/7] Clearing Metro bundler cache..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "metro-*" -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Metro cache cleared" -ForegroundColor Green
Write-Host ""

# Clear temp cache
Write-Host "[4/7] Clearing temp cache..." -ForegroundColor Yellow
$tempPath = [System.IO.Path]::GetTempPath()
Remove-Item -Path "$tempPath\metro-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$tempPath\react-*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$tempPath\haste-*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  ✓ Temp cache cleared" -ForegroundColor Green
Write-Host ""

# Clear npm cache
Write-Host "[5/7] Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "  ✓ npm cache cleared" -ForegroundColor Green
Write-Host ""

# Clear watchman cache
Write-Host "[6/7] Clearing watchman cache..." -ForegroundColor Yellow
$watchmanExists = Get-Command watchman -ErrorAction SilentlyContinue
if ($watchmanExists) {
    watchman watch-del-all
    Write-Host "  ✓ Watchman cache cleared" -ForegroundColor Green
} else {
    Write-Host "  ! Watchman not installed (skip)" -ForegroundColor Gray
}
Write-Host ""

# Device instructions
Write-Host "[7/7] Manual device steps required..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  CLEAR DATA ON YOUR DEVICE:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  iOS:" -ForegroundColor White
Write-Host "  1. Shake device or press Cmd+D"
Write-Host "  2. Tap 'Settings'"
Write-Host "  3. Tap 'Clear AsyncStorage'"
Write-Host "  4. Delete app from device"
Write-Host "  5. Reinstall from Expo/TestFlight"
Write-Host ""
Write-Host "  Android:" -ForegroundColor White
Write-Host "  1. Shake device or press Ctrl+M"
Write-Host "  2. Tap 'Settings'"
Write-Host "  3. Tap 'Clear AsyncStorage'"
Write-Host "  4. Settings → Apps → [Your App]"
Write-Host "  5. Storage → Clear Data"
Write-Host "  OR delete and reinstall the app"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESET COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Clear device data (see above)"
Write-Host "2. Run: npx expo start --clear --tunnel"
Write-Host "3. If still issues, rebuild: eas build --platform ios --profile development"
Write-Host ""
