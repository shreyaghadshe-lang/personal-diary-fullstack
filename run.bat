@echo off
setlocal
title Ledger - Personal Diary
echo ========================================================
echo   Ledger - Personal Diary (Spring Boot Backend)
echo ========================================================
echo.

cd /d "%~dp0"

REM Find Java executable
set "JAVA_EXE=java"
if exist "C:\Program Files\Java\jdk-25\bin\java.exe" (
    set "JAVA_EXE=C:\Program Files\Java\jdk-25\bin\java.exe"
) else if exist "C:\Program Files\Java\jdk-17\bin\java.exe" (
    set "JAVA_EXE=C:\Program Files\Java\jdk-17\bin\java.exe"
)

REM Check if target JAR exists; if not, build it using maven
if not exist "target\personal-diary-1.0.0.jar" (
    echo [INFO] Building application JAR...
    set "MVN_CMD=..\apache-maven-3.10.0-bin\apache-maven-3.10.0\bin\mvn.cmd"
    call "%MVN_CMD%" package -DskipTests
)

REM Check if MySQL is actively listening on port 3306
powershell -Command "if ((Test-NetConnection -ComputerName localhost -Port 3306 -WarningAction SilentlyContinue).TcpTestSucceeded) { exit 0 } else { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] MySQL Server detected on port 3306!
    echo [INFO] Connecting to MySQL database 'ledger_diary'...
    set "SPRING_ARGS="
) else (
    echo [NOTICE] MySQL Server is not currently running on port 3306.
    echo [NOTICE] Starting with persistent SQL database fallback (stored in ./data/ledger_diary).
    echo [TIP] To use MySQL 8, start MySQL Server and re-run this script anytime.
    set "SPRING_ARGS=--spring.profiles.active=local"
)

echo.
echo ========================================================
echo   Application starting...
echo   Open your browser at: http://localhost:8080
echo ========================================================
echo.

"%JAVA_EXE%" -jar "target\personal-diary-1.0.0.jar" %SPRING_ARGS%

pause
