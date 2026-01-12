@echo off
echo ========================================
echo   Boxdly - Letterboxd Tracker
echo ========================================
echo.
echo Checking Java version...
java -version
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java 17 or higher
    pause
    exit /b 1
)
echo.
echo Building the project...
call mvn clean install
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)
echo.
echo Starting the application...
echo.
echo The application will be available at: http://localhost:8080
echo.
call mvn spring-boot:run
