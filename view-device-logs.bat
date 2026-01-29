@echo off
echo ========================================
echo HEIRCLARK - DEVICE CONNECTION STATUS
echo ========================================
echo.
echo Checking dev server and device connection...
echo.

echo Server Status:
curl -s http://localhost:8082/status 2>nul
echo.
echo.

echo Active Device Connections:
netstat -ano | findstr "8082" | findstr "ESTABLISHED"
echo.
echo.

echo Dev Server is running on: http://192.168.4.28:8082
echo Your iPhone IP: 192.168.4.109
echo.

echo ========================================
echo LIVE LOGS (Press Ctrl+C to stop)
echo ========================================
echo.

:: Follow the dev server output log
powershell -Command "Get-Content 'C:\Users\derri\AppData\Local\Temp\claude\C--Users-derri\tasks\b8e8050.output' -Wait -Tail 50"
