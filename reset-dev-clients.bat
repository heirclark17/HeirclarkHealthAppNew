@echo off
echo ========================================
echo RESET ALL DEV CLIENTS
echo ========================================
echo.
echo This will:
echo - Kill all Node.js processes
echo - Clear Expo cache
echo - Clear Metro bundler cache
echo - Clear npm cache
echo - Clear temp files
echo - Reset development environment
echo.
pause
echo.

echo [1/7] Killing all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% equ 0 (
    echo   ✓ Node.js processes killed
) else (
    echo   ! No Node.js processes running
)
echo.

echo [2/7] Clearing Expo cache...
rd /s /q .expo 2>nul
rd /s /q .expo-shared 2>nul
echo   ✓ Expo cache cleared
echo.

echo [3/7] Clearing Metro bundler cache...
rd /s /q node_modules\.cache 2>nul
del /f /q metro-* 2>nul
echo   ✓ Metro cache cleared
echo.

echo [4/7] Clearing temp cache...
rd /s /q %TEMP%\metro-* 2>nul
rd /s /q %TEMP%\react-* 2>nul
rd /s /q %TEMP%\haste-* 2>nul
echo   ✓ Temp cache cleared
echo.

echo [5/7] Clearing npm cache...
call npm cache clean --force
echo   ✓ npm cache cleared
echo.

echo [6/7] Clearing watchman cache (if installed)...
where watchman >nul 2>nul
if %errorlevel% equ 0 (
    watchman watch-del-all
    echo   ✓ Watchman cache cleared
) else (
    echo   ! Watchman not installed (skip)
)
echo.

echo [7/7] Clearing AsyncStorage and device cache...
echo.
echo   MANUAL STEPS REQUIRED ON YOUR DEVICE:
echo.
echo   For iOS:
echo   1. Shake device or press Cmd+D
echo   2. Tap "Settings"
echo   3. Tap "Clear AsyncStorage"
echo   4. Force close the app
echo   5. Delete the app from device
echo   6. Reinstall from Expo
echo.
echo   For Android:
echo   1. Shake device or press Ctrl+M
echo   2. Tap "Settings"
echo   3. Tap "Clear AsyncStorage"
echo   4. Force close the app
echo   5. Go to Settings → Apps → Expo Go
echo   6. Tap "Storage" → "Clear Data"
echo   OR delete and reinstall the development build
echo.

echo ========================================
echo RESET COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Follow the manual device steps above
echo 2. Run: npx expo start --clear
echo 3. Rebuild if needed: npx expo prebuild --clean
echo.
pause
