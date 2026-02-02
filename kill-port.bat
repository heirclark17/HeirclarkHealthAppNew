@echo off
echo ========================================
echo Kill Process on Port
echo ========================================
echo.

set /p PORT="Enter port number (default 8081): "
if "%PORT%"=="" set PORT=8081

echo.
echo Finding process on port %PORT%...
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT%') do (
    set PID=%%a
)

if "%PID%"=="" (
    echo No process found on port %PORT%
    pause
    exit /b
)

echo Found PID: %PID%
echo Killing process...
taskkill /F /PID %PID%

echo.
echo Done!
pause
