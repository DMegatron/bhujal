@echo off
echo ==========================================
echo    Bhujal Groundwater Management Setup
echo ==========================================
echo.

echo Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js v16+ from https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ NPM not found! Please install NPM
    pause
    exit /b 1
)

echo ✅ Node.js and NPM found

echo.
echo Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Dependency installation failed
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!

echo.
echo Setting up environment...
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file from template
    echo ⚠️  Please edit .env file with your configuration
) else (
    echo ✅ .env file already exists
)

echo.
echo ==========================================
echo         Setup Complete! 🎉
echo ==========================================
echo.
echo Next steps:
echo 1. Edit .env file with your MongoDB URI and secrets
echo 2. Start development server: npm run dev
echo 3. Open http://localhost:3000
echo.
echo For detailed instructions, see INSTALL.md
echo.
pause
