@echo off
echo Starting development servers...

REM Start Next.js dev server in a new window
start "Network Pilot - Next.js" cmd /c "npm run dev"

REM Wait a few seconds for the Next.js server to potentially start
timeout /t 5 /nobreak > NUL

REM Start Genkit watch server in a new window
start "Network Pilot - Genkit" cmd /c "npm run genkit:watch"

REM Wait a few seconds for servers to initialize
timeout /t 5 /nobreak > NUL

REM Open the application in the default browser
echo Opening application in browser (http://localhost:9002)...
start http://localhost:9002

echo Development servers are running. Press Ctrl+C in the server windows to stop.
pause
