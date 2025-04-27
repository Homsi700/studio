@echo off
echo Starting the development server...

:: Start the Next.js development server in the background
start "NextDevServer" npm run dev

echo Waiting for server to start...
:: Wait for a few seconds to allow the server to initialize
timeout /t 5 /nobreak > nul

echo Opening the application in your default browser...
start http://localhost:9002

echo.
echo The development server is running. Press Ctrl+C in the server window to stop.

:: Keep this window open until the user closes it manually
pause
