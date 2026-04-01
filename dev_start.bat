@echo off
title XENIA AI Study Suite

echo ====================================
echo    XENIA AI Study Suite
echo ====================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from nodejs.org
    pause
    exit /b 1
)

echo [INFO] Starting Backend Server...
echo.

:: Start backend server in a new window
cd backend
if not exist ".venv" (
    echo [INFO] Creating Python virtual environment...
    python -m venv .venv
)

start "XENIA Backend - Port 8000" cmd /k ".venv\Scripts\activate && pip install -r requirements.txt --quiet && python run.py"

:: Wait for backend to start
timeout /t 5 /nobreak >nul

echo [INFO] Starting Frontend Server...
echo.

:: Start frontend server in a new window
cd ..\frontend
if not exist "node_modules" (
    echo [INFO] Installing Node dependencies...
    call npm install
)

start "XENIA Frontend - Port 3000" cmd /k "npm run dev"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

cd ..

echo.
echo ====================================
echo    XENIA is Starting Up!
echo ====================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak >nul

:: Open the application in default browser
start http://localhost:3000

echo.
echo ====================================
echo    XENIA is Running!
echo ====================================
echo.
echo To stop the servers, close the terminal windows.
echo.
echo Press any key to exit this window...
pause >nul
