@echo off
setlocal enabledelayedexpansion
title XENIA Quick Start
color 0A

:: ASCII Art Banner
echo.
echo     __  __ ______ _   _ _____          
echo     \ \/ /|  ____| \ | |_   _|   /\    
echo      \  / | |__  |  \| | | |    /  \   
echo      /  \ |  __| | . ` | | |   / /\ \  
echo     / /\ \| |____| |\  |_| |_ / ____ \ 
echo    /_/  \_\______|_| \_|_____/_/    \_\
echo.
echo        AI Study Suite - Quick Start
echo =========================================
echo.

:: Menu
echo Choose an option:
echo.
echo   1. Start Both Servers (Development)
echo   2. Start Backend Only
echo   3. Start Frontend Only
echo   4. Install Dependencies Only
echo   5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto :start_both
if "%choice%"=="2" goto :start_backend
if "%choice%"=="3" goto :start_frontend
if "%choice%"=="4" goto :install_deps
if "%choice%"=="5" goto :end

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto :menu

:install_deps
echo.
echo [SETUP] Installing dependencies...
echo.

:: Install backend dependencies
cd backend
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
)
echo Installing Python packages...
call .venv\Scripts\activate && pip install -r requirements.txt
cd ..

:: Install frontend dependencies
cd frontend
echo Installing Node packages...
call npm install
cd ..

echo.
echo [SUCCESS] Dependencies installed!
timeout /t 3
goto :menu

:start_backend
echo.
echo [BACKEND] Starting backend server...
cd backend
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
    call .venv\Scripts\activate && pip install -r requirements.txt --quiet
)
start "XENIA Backend" cmd /c "color 0E && .venv\Scripts\activate && echo. && echo ============================= && echo    XENIA Backend Server && echo    Running on port 8000 && echo ============================= && echo. && python run.py"
cd ..
echo [SUCCESS] Backend started on http://localhost:8000
timeout /t 3
goto :menu

:start_frontend
echo.
echo [FRONTEND] Starting frontend server...
cd frontend
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)
start "XENIA Frontend" cmd /c "color 0B && echo. && echo ============================= && echo    XENIA Frontend Server && echo    Running on port 3000 && echo ============================= && echo. && npm run dev"
cd ..
echo [SUCCESS] Frontend started on http://localhost:3000
timeout /t 3
goto :menu

:start_both
echo.
echo [STARTING] Launching XENIA Application...
echo.

:: Check requirements
python --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERROR] Python not found!
    echo Please install Python 3.10+ from python.org
    pause
    goto :end
)

node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERROR] Node.js not found!
    echo Please install Node.js 18+ from nodejs.org
    pause
    goto :end
)

:: Start Backend
echo [1/3] Starting Backend Server...
cd backend
if not exist ".venv" (
    echo      Creating virtual environment...
    python -m venv .venv
    echo      Installing Python packages...
    call .venv\Scripts\activate && pip install -r requirements.txt --quiet
)
start "XENIA Backend - localhost:8000" cmd /c "color 0E && .venv\Scripts\activate && cls && echo. && echo ========================================= && echo         XENIA BACKEND SERVER && echo         http://localhost:8000 && echo ========================================= && echo. && python run.py && pause"

:: Small delay
timeout /t 3 /nobreak >nul

:: Start Frontend
echo [2/3] Starting Frontend Server...
cd ..\frontend
if not exist "node_modules" (
    echo      Installing Node packages...
    call npm install
)
start "XENIA Frontend - localhost:3000" cmd /c "color 0B && cls && echo. && echo ========================================= && echo         XENIA FRONTEND SERVER && echo         http://localhost:3000 && echo ========================================= && echo. && npm run dev && pause"

cd ..

:: Wait and open browser
echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo.
echo =========================================
echo         XENIA IS RUNNING!
echo =========================================
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo.
echo Opening application in browser...
start http://localhost:3000

echo.
echo Press any key to return to menu...
pause >nul
goto :menu

:end
echo.
echo Thank you for using XENIA!
echo.
timeout /t 2 >nul
exit
