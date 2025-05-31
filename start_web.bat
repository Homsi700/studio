@echo off
echo Building Dawami web application for production...
npm run build
echo.
echo Starting Dawami web application...
npm start & (
    echo Waiting for application to start...
    timeout /t 5 /nobreak > nul
    echo Opening Dawami in your default browser...
    start http://localhost:3000
)
echo.
echo Dawami is now running.
echo You can access it via your web browser, typically at:
echo   - http://localhost:3000 (from the local computer)
echo   - http://[Your_Computer_Local_IP]:3000 (from other devices on the same local network)
echo.
echo This window will close automatically if the application stops.
echo To stop the application manually, close this window or press Ctrl+C in the terminal where "npm start" is running.
pause