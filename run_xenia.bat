@echo off
:: XENIA One-Click Starter
:: This script starts both backend and frontend servers with a single click

echo.
echo ========================================
echo         XENIA AI STUDY SUITE
echo          One-Click Starter
echo ========================================
echo.

:: Start Backend
echo Starting Backend Server...
cd backend
start /min cmd /c ".venv\Scripts\activate 2>nul || (python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt --quiet) && python run.py"

:: Give backend time to start
timeout /t 3 /nobreak >nul

:: Start Frontend
echo Starting Frontend Server...
cd ..\frontend
start /min cmd /c "npm run dev"

:: Give frontend time to start
timeout /t 5 /nobreak >nul

:: Open browser
echo.
echo ========================================
echo    XENIA is now running!
echo ========================================
echo.
echo Opening http://localhost:3000 in your browser...
echo.
start http://localhost:3000

:: Keep window open for a moment
timeout /t 3 /nobreak >nul
exit
