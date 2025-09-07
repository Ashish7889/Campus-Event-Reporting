@echo off
REM Campus Event Reporting System - Windows Deployment Script

echo 🚀 Starting Campus Event Reporting System deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is available

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "data" mkdir data
if not exist "logs" mkdir logs
if not exist "ssl" mkdir ssl

echo ✅ Directories created

REM Build Docker image
echo 🔨 Building Docker image...
docker build -t campus-event-reporting:latest .
if %errorlevel% neq 0 (
    echo ❌ Failed to build Docker image
    pause
    exit /b 1
)

echo ✅ Docker image built successfully

REM Stop existing containers
echo 🛑 Stopping existing containers...
docker-compose down >nul 2>&1

REM Start the application
echo 🚀 Starting application...
docker-compose up -d campus-events
if %errorlevel% neq 0 (
    echo ❌ Failed to start application
    pause
    exit /b 1
)

echo ✅ Application started successfully

REM Wait for application to be ready
echo ⏳ Waiting for application to be ready...
timeout /t 10 >nul

REM Health check
echo 🩺 Performing health check...
curl -f http://localhost:4000/api/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Application might still be starting up. Check logs with:
    echo    docker-compose logs campus-events
) else (
    echo ✅ Application is healthy and responding
)

REM Show deployment information
echo.
echo 🎉 Campus Event Reporting System deployed!
echo.
echo 📱 Application URL: http://localhost:4000
echo 🔗 API Health Check: http://localhost:4000/api/health
echo 📊 Admin Panel: http://localhost:4000 (click ADMIN)
echo 🔑 Admin Token: admin123456
echo.
echo 📋 Useful commands:
echo   View logs:     docker-compose logs -f campus-events
echo   Stop app:      docker-compose down
echo   Restart app:   docker-compose restart campus-events
echo   Update app:    scripts\deploy.bat
echo.
pause
