@echo off
echo Building Dawami web application for production...
npm run build
IF ERRORLEVEL 1 (
    echo Build failed. Aborting.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Starting Dawami web application on port 9002...
echo You can access it via your web browser at:
echo   - http://localhost:9002
echo   - http://%COMPUTERNAME%:9002 (from other devices on the same local network)
echo   - Or use your computer's local IP address: http://[Your_Computer_Local_IP]:9002
echo.
echo Attempting to open browser...
start http://localhost:9002

echo.
echo Running the application. Server logs will be displayed in this window.
echo Press Ctrl+C in this window to stop the server.
npm start

echo.
echo Server has been stopped or failed to start.
pause
