@echo off
echo ========================================
echo FIX EXPO DEV CONNECTION
echo ========================================
echo.

echo Step 1: Getting your local IP address...
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo Your Local IP: !IP!
)
echo.

echo Step 2: Checking if Metro is running...
netstat -ano | findstr :8081 >nul
if %errorlevel% equ 0 (
    echo   ✓ Metro is running on port 8081
) else (
    echo   ✗ Metro is NOT running!
    echo   Run: npx expo start --tunnel
)
echo.

echo Step 3: Testing firewall rules...
netsh advfirewall firewall show rule name="Expo Metro Bundler" >nul 2>&1
if %errorlevel% equ 0 (
    echo   ✓ Firewall rule exists
) else (
    echo   ✗ Firewall rule missing!
    echo.
    echo   Creating firewall rule...
    netsh advfirewall firewall add rule name="Expo Metro Bundler" dir=in action=allow program="%ProgramFiles%\nodejs\node.exe" protocol=TCP localport=8081,19000,19001,19002
    if %errorlevel% equ 0 (
        echo   ✓ Firewall rule created
    ) else (
        echo   ✗ Failed - Run as Administrator
    )
)
echo.

echo ========================================
echo RECOMMENDED SOLUTIONS:
echo ========================================
echo.
echo Option 1: TUNNEL MODE (Easiest)
echo   npx expo start --tunnel
echo.
echo Option 2: USB + Localhost (Android only)
echo   adb reverse tcp:8081 tcp:8081
echo   npx expo start --localhost
echo.
echo Option 3: LAN mode (requires firewall fix)
echo   npx expo start --lan
echo.
echo Option 4: Check same WiFi network
echo   Computer and device must be on SAME network
echo.

echo ========================================
echo TROUBLESHOOTING CHECKLIST:
echo ========================================
echo [ ] Computer and device on same WiFi?
echo [ ] Firewall rule created (run as Admin)?
echo [ ] Metro running on port 8081?
echo [ ] Device can ping computer IP?
echo [ ] Try tunnel mode: npx expo start --tunnel
echo.
pause
