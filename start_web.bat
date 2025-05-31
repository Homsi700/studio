@echo off
echo Building Dawami web application for production...
npm run build
echo.
echo Starting Dawami web application...
rem Consider adding -H 0.0.0.0 if npm start doesn't listen on all interfaces by default
npm start
echo.
echo Dawami is now running.
echo You can access it via your web browser, typically at:
echo   - http://localhost:3000 (from the local computer)
echo   - http://[Your_Computer_Local_IP]:3000 (from other devices on the same local network)
echo.
echo Make sure your firewall allows connections to port 3000 if accessing from other devices.
echo.
echo Press Ctrl+C in this window to stop the application.
pause
