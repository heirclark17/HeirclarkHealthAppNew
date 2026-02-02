@echo off
echo Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1

echo Starting Expo with TypeScript checks disabled...
set EXPO_NO_TYPESCRIPT_CHECK=1
npx expo start --clear --tunnel
