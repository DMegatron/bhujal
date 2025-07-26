@echo off
echo ================================================
echo  Bhujal ML Prediction Service Setup (Windows)
echo ================================================

echo.
echo [1/4] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

python --version

echo.
echo [2/4] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    if %errorlevel% neq 0 (
        echo Error: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created successfully
) else (
    echo Virtual environment already exists
)

echo.
echo [3/4] Activating virtual environment and installing Python packages...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo Error: Failed to activate virtual environment
    pause
    exit /b 1
)

echo Installing Python packages...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install Python packages
    pause
    exit /b 1
)

echo.
echo [4/4] Installing Node.js dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo ================================================
echo  Setup completed successfully!
echo ================================================
echo.
echo To run the application with ML predictions:
echo.
echo 1. Start both services: npm run dev:full
echo 2. Or start separately:
echo    - Node.js: npm run dev
echo    - Python ML service: venv\Scripts\activate.bat ^&^& python predict_service.py
echo.
echo Make sure you have:
echo - Created a .env file with your configuration
echo - MongoDB running on your system
echo - The groundwater_model.pkl file in the root directory
echo.
pause
