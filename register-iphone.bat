@echo off
echo ========================================
echo REGISTER YOUR IPHONE FOR DEVELOPMENT
echo ========================================
echo.
echo IMPORTANT: Follow these steps CAREFULLY
echo.
echo After running this command:
echo.
echo 1. A QR CODE will appear on this screen
echo 2. Open CAMERA app on your iPhone
echo 3. Point camera at the QR code
echo 4. Tap the notification that appears
echo 5. Safari opens - tap "Allow"
echo 6. Safari shows a message - CLOSE Safari
echo 7. Open SETTINGS app on your iPhone
echo 8. Look for "Profile Downloaded" near the top
echo 9. Tap "Profile Downloaded"
echo 10. Tap "Install" (top right)
echo 11. Enter your iPhone passcode
echo 12. Tap "Install" again (confirmation)
echo 13. Tap "Install" one more time
echo 14. Tap "Done"
echo.
echo After completing ALL steps above, your iPhone is registered!
echo Then come back here and run: rebuild-ios.bat
echo.
pause
echo.
cd /d "%~dp0"
eas device:create
echo.
echo ========================================
echo If registration completed successfully,
echo now run: rebuild-ios.bat
echo ========================================
echo.
pause
