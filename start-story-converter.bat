@echo off
echo Starting Story Voice Converter...
echo.

REM Get the directory where this batch file is located
cd /d "%~dp0"

REM Check if node_modules exists, if not run npm install
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting the application...
echo The app will open automatically in your browser at http://localhost:5173
echo.
echo To stop the application, press Ctrl+C in this window
echo.

REM Start the development server (this includes both frontend and backend)
call npm run dev

pause 